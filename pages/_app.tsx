import "../styles/globals.css"
import type { AppProps } from "next/app"
import Link from "next/link"
import Stack, { TCustomTransitionsParams } from "../components/stack/Stack"
import { useCallback, useState } from "react"

export const TRANSITION_DURATION = 0.7

function App({ Component, pageProps }: AppProps): JSX.Element {
  /**
   * Select transition example type
   */
  const [transitionFn, setTransitionFn] = useState("crossed")
  const handleSelectChange = (e) => {
    const v = e.target.value
    console.log(e.target.value)
    setTransitionFn(v)
  }

  /**
   * Crossed transitions example
   * - playOut & playIn together
   */
  const crossed = useCallback(
    ({ prev, current }: TCustomTransitionsParams): Promise<void> =>
      new Promise(async (resolve) => {
        if (prev) prev.playOut?.()
        await current.playIn?.()
        resolve()
      }),
    []
  )

  /**
   * Sequential transitions example
   * - playOut then, playIn
   */
  const sequential = useCallback(
    ({ prev, current }: TCustomTransitionsParams): Promise<void> =>
      new Promise(async (resolve) => {
        if (prev) await prev.playOut?.()
        await current.playIn?.()
        resolve()
      }),
    []
  )

  return (
    <div className={"App"}>
      <select onChange={handleSelectChange} defaultValue={"crossed"}>
        <option>crossed</option>
        <option>sequential</option>
      </select>
      <br />
      <br />
      <nav>
        <Link href="/">Home</Link>
        <br />
        <Link href="/about">About</Link>
      </nav>
      <Stack
        pageProps={pageProps}
        Component={Component}
        customTransitions={transitionFn === "crossed" ? crossed : sequential}
      />
    </div>
  )
}

export default App
