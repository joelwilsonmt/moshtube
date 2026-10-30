// Whether focus last moved by keyboard (Tab) or pointer. :focus-visible can't answer this
// for key handling: Chrome turns it on as soon as any key is pressed on a focused control.
let keyboard = false

window.addEventListener('pointerdown', () => { keyboard = false }, true)
window.addEventListener('keydown', (e) => { if (e.key === 'Tab') keyboard = true }, true)

export const focusedByKeyboard = () => keyboard
