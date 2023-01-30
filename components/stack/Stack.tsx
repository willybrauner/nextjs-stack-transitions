import React, { useRef, useReducer, useLayoutEffect, useEffect } from "react"
import { NextComponentType, NextPageContext } from "next"
import { Router } from "next/router"

export interface IRouteStack {
  componentName?: string
  playIn?: () => Promise<any>
  playOut?: () => Promise<any>
  $root?: HTMLElement
}

export interface TCustomTransitionsParams {
  prev: IRouteStack
  current: IRouteStack
  unmountPrev: () => void
}

export interface IProps {
  Component: NextComponentType<NextPageContext>
  customTransitions: (T: TCustomTransitionsParams) => Promise<void>
  pageProps
}

// Helper
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" && window.document?.createElement ? useLayoutEffect : useEffect

/**
 * Stack component
 * @param props
 */
function Stack(props: IProps): JSX.Element {
  const $prevRef = useRef<IRouteStack>(null)
  const $currentRef = useRef<IRouteStack>(null)

  const componentReducer = (
    state: {
      prev?: NextComponentType<NextPageContext>
      prevPageProps?
      current?: NextComponentType<NextPageContext>
      pageProps?
      count: number
    },
    action: { type: "update" | "unmount-prev"; component?; pageProps? }
  ) => {
    switch (action.type) {
      case "update":
        return {
          ...state,
          prev: state.current,
          prevPageProps: state.pageProps,

          current: action.component,
          pageProps: action.pageProps,
          count: state.count + 1,
        }
      case "unmount-prev":
        return {
          ...state,
          prev: null,
          prevPageProps: null,
        }
      default:
        throw new Error()
    }
  }

  const [state, dispatch] = useReducer(componentReducer, {
    prev: null,
    prevPageProps: null,
    current: props.Component,
    pageProps: props.pageProps,
    count: 0,
  })

  // --------------------------------------------------------------------------- NEW COMPONENT

  // 1. each time stack get new Component as props
  // update global reducer state
  const firstRender = useRef(true)
  useIsomorphicLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    if (!props.Component) return
    dispatch({
      type: "update",
      component: props.Component,
      pageProps: props.pageProps,
    })
  }, [props.Component, props.pageProps])

  // --------------------------------------------------------------------------- PATCH

  /**
   * NextJS will remove module.css property from HTML document when route change
   * This hake allows to copy this CSS to avoid page style clip on page play-out transition
   * MAXI tricky but no choice. Farmer Motion got the same issue
   * https://github.com/vercel/next.js/discussions/18724#discussioncomment-967618
   *
   */
  const copies = useRef([])
  const onLoad = (): void => {
    resetStyleCopies()
    // Create a clone of every <style> and <link> that currently affects the page. It doesn't matter
    // if Next.js is going to remove them or not since we are going to remove the copies ourselves
    // later on when the transition finishes.
    const nodes = Array.from(
      document.querySelectorAll("link[rel=stylesheet], style:not([media=x])")
    )
    copies.current = nodes.map((el) => el.cloneNode(true))
    for (let copy of copies.current) {
      // Remove Next.js' data attributes so the copies are not removed from the DOM in the route
      // change process.
      copy.removeAttribute("data-n-p")
      copy.removeAttribute("data-n-href")
      // Add duplicated nodes to the DOM.
      document.head.appendChild(copy)
    }
  }
  // Remove previous page's styles after the transition has finalized.
  const resetStyleCopies = (): void => {
    for (let copy of copies.current) {
      document.head.removeChild(copy)
    }
    copies.current = []
  }

  useIsomorphicLayoutEffect(() => {
    Router.events.on("beforeHistoryChange", onLoad)
    return () => {
      Router.events.off("beforeHistoryChange", onLoad)
    }
  }, [])

  // --------------------------------------------------------------------------- ANIMATE

  // 2. animate when route state changed
  useIsomorphicLayoutEffect(() => {
    if (!state.current) {
      console.log("No current route in state", state)
      return
    }

    const unmountPrev = () => {
      dispatch({ type: "unmount-prev" })
      resetStyleCopies()
    }

    props
      .customTransitions({
        prev: $prevRef.current,
        current: $currentRef.current,
        unmountPrev,
      })
      // when internal promise is resolved
      .then(unmountPrev)
  }, [state.current, props.customTransitions])

  // --------------------------------------------------------------------------- RENDER

  // prettier-ignore
  return (
    <div className={"Stack"}>
      {state.prev && (
        <state.prev
          {...(state.prevPageProps || {})}
          ref={$prevRef}
          key={state.count}
        />
      )}
      {state.current && (
        <state.current
          {...(state.pageProps || {})}
          ref={$currentRef}
          key={state.count + 1}
        />
      )}
    </div>
  );
}

export default Stack
