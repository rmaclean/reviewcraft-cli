export interface IRankedItem<T> {
  rank: number
  key: number
  value: T
}

export default <T>(source: T[], determineKey: (item: T) => number, descending: boolean = false): Array<IRankedItem<T>> => {
  const result = source.map(originalValue => {
    const key = determineKey(originalValue)
    return {
      key,
      value: originalValue,
      rank: 0
    } satisfies IRankedItem<T>
  })

  result.sort((a, b) => {
    const result = a.key - b.key
    if (descending) {
      return result * -1
    } else {
      return result
    }
  })

  let rank = 1
  let rankOffset = 0
  let lastKey = result[0].key
  result[0].rank = 1

  for (let index = 1; index < result.length; index++) {
    const item = result[index]

    if (item.key === lastKey) {
      item.rank = rank
      rankOffset++
    } else {
      lastKey = item.key
      rank = rank + rankOffset + 1
      item.rank = rank
      rankOffset = 0
    }
  }

  return result
}
