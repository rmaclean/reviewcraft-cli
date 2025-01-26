 
import * as fs from 'node:fs/promises'
import * as XLSX from 'xlsx'

const rawEvalData = await fs.readFile('data/evals.xlsx')
const evalData = XLSX.read(rawEvalData)

const data: Record<string, IReviewStats> = {}

evalData.SheetNames.forEach(sheetName => {
  (XLSX.utils.sheet_to_json(evalData.Sheets[sheetName]) as IReviewerEvals[])
    .forEach(row => {
      const reviewStats: IReviewStats = data[row['Session Id']] ?? {
        diamond: 0,
        hardNo: 0,
        seen: 0
      }

      if (row.Action !== 'Ignored') {
        reviewStats.seen++
      }

      switch (row.Action) {
        case 'Doesn\'t fit': {
          reviewStats.hardNo++
          break
        }
        case 'Top session': {
          reviewStats.diamond++
          break
        }
      }

      data[row['Session Id']] = reviewStats
    })
})

const getReviewStats = (sessionId: string): IReviewStats => {
  return data[sessionId]
}

export { getReviewStats }
