import * as fs from 'node:fs/promises'
import XLSX from 'xlsx'
import ranker, { type IRankedItem } from './ranker.ts'

const evaluatorRawData = await fs.readFile('data/reviewers.xlsx')
const evaluatorDataBook = XLSX.read(evaluatorRawData)
const sheet = evaluatorDataBook.Sheets['Evaluation results']
const evaluatorData: IReviewerSheetStats[] = XLSX.utils.sheet_to_json(sheet)

const data: Record<string, IReviewerStats> = {}

const range = ['N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL']

const endRow = 480

const reviewers: Record<string, Array<IRankedItem<IReviewerData>>> = {}

const nameRegex = /(?<fi>[A-Z])(\w|\s)+(?<li>[A-Z])\w+(\s\(Evaluation\))/

range.forEach(column => {
  const originalData: IReviewerData[] = []
  for (let rowIndex = 2; rowIndex < endRow + 1; rowIndex++) { // this does need to offset from 2 due to excel
    const cell = `${column}${rowIndex}`
    const average: number | null = sheet[cell]?.v
    if (average != null) {
      originalData.push({
        average,
        originalRank: rowIndex - 2
      })
    }
  }

  const name = sheet[`${column}1`].v.replace(nameRegex, '$1$3')

  reviewers[name] = ranker(originalData, i => i.average, true)
})

evaluatorData.forEach((row, rowIndex) => {
  const reviewersData: IReviewer[] = []

  Object.keys(reviewers).forEach(reviewer => {
    const data = reviewers[reviewer].find(i => i.value.originalRank === rowIndex)

    if (data != null) {
      reviewersData.push({
        name: reviewer,
        average: data.key,
        rank: data.rank
      })
    }
  })

  data[row['Session Id']] = {
    average: +row[' Average (Evaluation)'],
    median: +row[' Median (Evaluation)'],
    originalRank: rowIndex + 1,
    reviewersRank: reviewersData.map(v => v.rank)
  }
})

const getReviewerStats = (sessionId: string): IReviewerStats => {
  return data[sessionId]
}

export { getReviewerStats }
