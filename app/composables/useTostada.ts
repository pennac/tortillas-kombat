// Easter egg "¡Tostada!": una fetta di pane sbuca dall'angolo con la voce.
const visible = ref(false)
let shownThisSession = false

export function useTostada() {
  const { play } = useSfx()

  function show() {
    if (visible.value) return
    visible.value = true
    play(VOZ.tostada)
    setTimeout(() => { visible.value = false }, 1600)
  }

  /** a caso, al massimo una volta per sessione */
  function maybe(chance = 0.15) {
    if (shownThisSession || Math.random() > chance) return
    shownThisSession = true
    show()
  }

  return { visible, show, maybe }
}
