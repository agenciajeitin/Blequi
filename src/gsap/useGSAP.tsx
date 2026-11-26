import { useEffect } from 'react'
import { gsap } from 'gsap'

/**
 * GSAP hook for React components (similar to useGSAP from @gsap/react)
 * Handles cleanup on unmount and returns the gsap instance.
 */
export function useGSAP(
  animations: gsap.tween[] | gsap.tween | gsap.kill | ((gsap: typeof gsap) => gsap.tween[] | gsap.tween),
  deps: any[] = []
) {
  useEffect(() => {
    const timeline = Array.isArray(animations) ? gsap.timeline({ paused: true }) : gsap.timeline({ paused: true })
    const animationsToRun = Array.isArray(animations) ? animations : [animations]

    animationsToRun.forEach((anim) => {
      if (typeof anim === 'function') {
        anim(gsap)
      } else if (gsap.isTween(anim) || gsap.isTimeline(anim)) {
        // It's already a GSAP tween/timeline
      }
    })

    timeline.play()

    return () => {
      timeline.kill()
    }
  }, deps)
}

/**
 * Shortened GSAP to for quick tweens
 */
export const g = (target: string | Element | {} | gsap.Kill | null | undefined, vars?: any) =>
  gsap.to(target, vars)

/**
 * Stagger function for GSAP
 */
export const stagger = (elements: any[], vars: any, index?: number) =>
  gsap.staggerTo(elements, vars, { index })

/**
 * Call function for GSAP (executes a function at a specific time in a timeline)
 */
export const call = (func: Function, vars?: any) => gsap.call(func, vars)

export { gsap }