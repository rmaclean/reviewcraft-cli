
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import * as fs from 'node:fs/promises'
import Handlebars from 'handlebars'
import * as XLSX from 'xlsx'
import clipboard from 'clipboardy'
import chalk from 'chalk'
import { getReviewStats } from './reviewStats.js'
import { getReviewerStats } from './reviewerStats.js'

const rl = readline.createInterface({ input, output })
try {
  const rawEmailTemplate = await fs.readFile('./template/email.handlebars', 'utf8')
  const emailTemplate = Handlebars.compile(rawEmailTemplate)

  const rawTalkTemplate = await fs.readFile('./template/talk.handlebars', 'utf8')
  const talkTemplate = Handlebars.compile(rawTalkTemplate)

  const rawData = await fs.readFile('data/data.xlsx')
  const data = XLSX.read(rawData)
  const speakerData = XLSX.utils.sheet_to_json(data.Sheets.Speakers) as ISpeaker[]
  const sessionData = XLSX.utils.sheet_to_json(data.Sheets.Sessions) as ISession[]
  const teamCommentsData = XLSX.utils.sheet_to_json(data.Sheets['Team comments']) as ITeamComments[]

  const findSpeaker = (email: string): (ISpeaker | null) => {
    for (let index = 0; index < speakerData.length; index++) {
      const speaker = speakerData[index]
      if (speaker.Email?.toLocaleLowerCase() === email.toLocaleLowerCase()) {
        return speaker
      }
    }

    return null
  }

  const findComments = (sessionId: string): ITeamComments[] => {
    return teamCommentsData.filter(comment => (comment['Session Id'] === sessionId && comment.Comment.trim().length >= 2))
  }

  const findSessions = (speakerId: string): ISession[] => {
    return sessionData.filter(session => {
      const speakerIds = session['Speaker Ids'].split(',')
      return speakerIds.includes(speakerId)
    })
  }

  const processRequest = async (): Promise<void> => {
    const email = await rl.question(chalk.white('Speaker email: '))
    const speaker = findSpeaker(email.trim())
    if (speaker == null) {
      console.log(chalk.red('Speaker not found!'))
      return
    }

    console.log()
    const localColor = speaker['Are you based in South Africa?'] === 'Yes' ? chalk.green : chalk.yellow
    console.log(`Speaker is local? ${localColor(speaker['Are you based in South Africa?'])}`)
    const sessions = findSessions(speaker['Speaker Id'])

    const talks: string[] = []

    for (let index = 0; index < sessions.length; index++) {
      const session = sessions[index]

      const comments = findComments(session['Session Id']).map(comment => comment.Comment)
      const stats = getReviewStats(session['Session Id'])
      const reviewerStats = getReviewerStats(session['Session Id'])
      let notes = session['Owner Notes'] ?? ''
      if (notes.trim() === '') { notes = '(no notes provided by the presenter)\n' }

      console.log()
      console.log(session.Title)
      console.log()
      console.log(session.Description)
      console.log()
      console.log('.0.0.0.0.0.0.0.0.0.0.0.0.0.0.')
      console.log()
      console.log(`Outline:\n${session['Talk Outline']}`)
      console.log()
      console.log('.0.0.0.0.0.0.0.0.0.0.0.0.0.0.')
      console.log()
      console.log('Track: ' + session.Track)
      console.log()
      console.log('.0.0.0.0.0.0.0.0.0.0.0.0.0.0.')
      console.log()
      console.log(`Notes:\n${notes}`)
      console.log()
      console.log('Comments:')
      for (let commentIndex = 0; commentIndex < comments.length; commentIndex++) {
        const comment = comments[commentIndex]
        console.log(`${commentIndex}) ${comment}`)
      }
      console.log()
      console.dir(stats)
      console.dir(reviewerStats)
      if (session.Status === 'Accepted') {
        console.log(chalk.green('This talk was accepted!'))
      }

      const feedback = await rl.question('Feedback: ')
      console.log()

      let reviewerFeedback = ''
      if (comments.length > 0) {
        for (let commentIndex = 0; commentIndex < comments.length; commentIndex++) {
          const comment = comments[commentIndex]
          const add = await rl.question(`Include this feedback "${comment}" (Y/n): `)
          if (add === '' || add.toLocaleLowerCase() === 'y') {
            reviewerFeedback += `💠 ${comment}\n`
          }
        }
      }

      if (reviewerFeedback === '') {
        reviewerFeedback = 'No reviewer\'s feedback was provided during the review process for this submission.'
      }

      talks.push(talkTemplate({
        title: session.Title,
        description: session.Description,
        outline: session['Talk Outline'],
        notes,
        rank: reviewerStats.originalRank + 1,
        reviewerFeedback,
        feedback,
        seen: stats.seen,
        hardNo: stats.hardNo,
        diamond: stats.diamond,
        average: reviewerStats.average,
        median: reviewerStats.median,
        reviewerRank: reviewerStats.reviewersRank
      }))
    }

    const emailText = emailTemplate({
      firstName: speaker.FirstName,
      pluralS: talks.length > 1 ? 's' : '',
      talk1: talks[0],
      talk2: talks.length > 1 ? talks[1] : '',
      talk3: talks.length > 2 ? talks[2] : '',
    })

    await clipboard.write(emailText)
  }

  const askForMore = async (): Promise<boolean> => {
    let more = ''
    while (true) {
      more = (await rl.question('More (Y/n): ')).toLocaleLowerCase()
      if (more === '') {
        more = 'y'
      }
      if (more === 'n' || more === 'y') {
        break
      }
    }

    return more === 'y'
  }

  while (true) {
    await processRequest()
    const more = await askForMore()
    if (!more) {
      break
    }
  }
} finally {
  rl.close()
}
