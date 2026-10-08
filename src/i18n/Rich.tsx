/** 文の中の **…** を太字にして出す（ことばによって太字の位置が変わる文を、1つの文のまま訳すため） */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/).map((s, i) => (i % 2 ? <b key={i}>{s}</b> : s))}
    </>
  )
}
