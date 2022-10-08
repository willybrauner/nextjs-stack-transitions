import { useRef, useEffect, useReducer, memo, ReactNode } from "react"
import { NextComponentType, NextPageContext } from "next"

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
}

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
      current?: NextComponentType<NextPageContext>
      count: number
    },
    action: { type: "update" | "unmount-prev"; component? }
  ) => {
    switch (action.type) {
      case "update":
        return {
          ...state,
          prev: state.current,
          current: action.component,
          count: state.count + 1,
        }
      case "unmount-prev":
        return {
          ...state,
          prev: null,
        }
      default:
        throw new Error()
    }
  }

  const [state, dispatch] = useReducer(componentReducer, {
    prev: null,
    current: props.Component,
    count: 0,
  })

  // 1. each time stack get new Component as props
  // update global reducer state
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (props.Component) dispatch({ type: "update", component: props.Component })
  }, [props.Component])

  // 2. animate when route state changed
  useEffect(() => {
    if (!state.current) {
      console.log("No current route in state", state)
      return
    }
    const unmountPrev = () => dispatch({ type: "unmount-prev" })
    props
      .customTransitions({
        prev: $prevRef.current,
        current: $currentRef.current,
        unmountPrev,
      })
      .then(unmountPrev)
  }, [state.current, props.customTransitions])

  return (
    <div className={"Stack"}>
      {state.prev && <state.prev ref={$prevRef} key={state.count} />}
      {state.current && <state.current ref={$currentRef} key={state.count + 1} />}
    </div>
  )
}

export default memo(Stack)
