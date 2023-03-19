interface ISpeaker {
  'Speaker Id': string
  FirstName: string
  LastName: string
  Email: string | undefined
  TagLine: string
  Bio: string
  Twitter: string
  'Your pronouns': string
  'Racial Group': string
  'Are you based in South Africa?': 'Yes' | 'No'
  'DevConf is an in-person event': string
  'Mailing List': string
  LinkedIn: string
  'Company Website': string
  'Profile Picture': string
}

interface ISession {
  'Session Id': string
  Title: string
  Description: string
  Owner: string
  'Owner Email': string
  Speakers: string
  Track: string
  Status: 'Accepted' | 'Declined'
  'Date Submitted': string
  'Owner Notes': string
  'Speaker Ids': string
}

interface ITeamComments {
  'Session Id': string
  Session: string
  Comment: string
  Author: string
  DateCommented: string
}

interface IEvaluationResults {
  'Session Id': string
  Title: string
  Description: string
  Owner: string
  'Owner Email': string
  Track: string
  Evaluation: string
}

interface IReviewStats {
  hardNo: number
  diamond: number
  seen: number
}

interface IReviewerEvals {
  'Session Id': string
  Session: string
  'Comparison Id': string
  'Compared at': string
  'Action': 'Ranked' | 'Doesn\'t fit' | 'Top session' | 'Ignored'
  'Ranked as': string
  'Expected score': string
  'Actual score': string
  'K factor': string
  'Rating change': string
  'Rating': string
}
