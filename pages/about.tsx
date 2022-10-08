import { gsap } from "gsap"
import { forwardRef, useRef, useImperativeHandle } from "react"
import { TRANSITION_DURATION } from "./_app"

function About(props, handleRef): JSX.Element {
  const $root = useRef<HTMLDivElement>(null)

  const playIn = () =>
    gsap
      .timeline({ defaults: { duration: TRANSITION_DURATION, ease: "power3.out" } })
      .fromTo($root.current, { autoAlpha: 0, x: -50 }, { autoAlpha: 1, x: 0 })

  const playOut = () =>
    gsap
      .timeline({ defaults: { duration: TRANSITION_DURATION, ease: "power3.out" } })
      .to($root.current, { autoAlpha: 0, x: 50 })

  useImperativeHandle(handleRef, () => ({
    playIn,
    playOut,
    $root: $root.current,
  }))

  return (
    <div ref={$root}>
      <h1>About</h1>
    </div>
  )
}

About.displayName = "About"
export default forwardRef<HTMLDivElement>(About)
