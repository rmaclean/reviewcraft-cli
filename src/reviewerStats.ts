import * as fs from 'node:fs/promises'
import XLSX from 'xlsx'

const evaluatorRawData = await fs.readFile('data/reviewers.xlsx')
const evaluatorDataBook = XLSX.read(evaluatorRawData)
const sheet = evaluatorDataBook.Sheets['Evaluation results']
const evaluatorData: IReviewerSheetStats[] = XLSX.utils.sheet_to_json(sheet)

const data: Record<string, IReviewerStats> = {}

const range = ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD']

const endRow = 623

const reviewers: Record<string, IReviewerData[]> = {}

const nameRegex = /(?<fi>[A-Z])(\w|\s)+(?<li>[A-Z])\w+(\s\(Evaluation\))/

range.forEach(column => {
  const originalData: IReviewerData[] = []
  for (let rowIndex = 2; rowIndex < endRow + 1; rowIndex++) {
    const cell = `${column}${rowIndex}`
    const average: number | null = sheet[cell]?.v
    if (average !== null) {
      originalData.push({
        average,
        originalRank: rowIndex - 2
      })
    }
  }

  const name = sheet[`${column}1`].v.replace(nameRegex, '$1$3')

  reviewers[name] = originalData.sort((a, b) => (a.average - b.average) * -1)
})

evaluatorData.forEach((row, rowIndex) => {
  const reviewersData: IReviewer[] = []
  Object.keys(reviewers).forEach(reviewer => {
    const reviewerRank = reviewers[reviewer].findIndex(v => v.originalRank === rowIndex)
    if (reviewerRank >= 0) {
      reviewersData.push({
        name: reviewer,
        average: reviewers[reviewer][reviewerRank].average,
        rank: reviewerRank
      })
    }
  })

  data[row['Session Id']] = {
    average: +row[' Average (Evaluation)'],
    median: +row[' Median (Evaluation)'],
    originalRank: rowIndex,
    reviewersRank: reviewersData.map(v => v.rank + 1)
  }
})

const getReviewerStats = (sessionId: string): IReviewerStats => {
  return data[sessionId]
}

export { getReviewerStats }
