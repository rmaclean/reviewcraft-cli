# reviewcraft-cli
Review Craft CLI is a simple node application which helps automate the writing of talk submission feedback. It is pretty specific for my needs with @DevConfza, but if you use Sessionize it would be easy to fork and use for your own needs.

# Getting started

1. Install dependencies: `yarn`
2. Update the templates in `./templates`
3. Go to Sessionize and use the _Everything in a single file_ export (in the export section) and save that as `data.xlsx` in the `data` folder
4. Go to Sessionize and use the _Evalution results_ export (in the export section) and save that as `reviewers.xlsx` in the `data` folder
5. Go to Sessionize and use the _Raw data for all users_ export (this is in Evaluation > Plan > Statistics > Export) and save that as `evals.xlsx` in the `data` folder
6. If you support more talk submissions than 3 per speaker, you may need to update the code in `./src/app.ts:136` to indicate that.
7. You need to set the `range` variable to be the reviewers you wish to include. The values in here should match the reviewers from `reviewers.xlsx`
8. You can then run it with `yarn run start`

# Wish list
1. Make `range` (step 7) above dynamic
2. Make the number of talks supported dynamic, so it does not need to be manually done
3. Switch to deno 🦕