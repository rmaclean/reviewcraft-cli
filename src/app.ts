import Handlebars from "handlebars";
import * as XLSX from "xlsx";
import { getReviewStats } from "./reviewStats.ts";
import { getReviewerStats } from "./reviewerStats.ts";
import term from "terminal-kit";
import { copyRichText } from "./copyRichText.ts";

const terminal = term.terminal;

terminal.windowTitle("ReviewCraft");

const rawEmailTemplate = await Deno.readTextFile("./template/email.handlebars");
const emailTemplate = Handlebars.compile(rawEmailTemplate);

const rawTalkTemplate = await Deno.readTextFile("./template/talk.handlebars");
const talkTemplate = Handlebars.compile(rawTalkTemplate);

const rawData = await Deno.readFile("data/data.xlsx");
const data = XLSX.read(rawData);
const speakerData = XLSX.utils.sheet_to_json(data.Sheets.Speakers) as ISpeaker[];
const sessionData = XLSX.utils.sheet_to_json(data.Sheets.Sessions) as ISession[];
const teamCommentsData = XLSX.utils.sheet_to_json(data.Sheets["Team comments"]) as ITeamComments[];

const findSpeaker = (email: string): ISpeaker | null => {
  for (let index = 0; index < speakerData.length; index++) {
    const speaker = speakerData[index];
    if (speaker.Email?.toLocaleLowerCase() === email.toLocaleLowerCase()) {
      return speaker;
    }
  }

  return null;
};

const findComments = (sessionId: string): ITeamComments[] => {
  return teamCommentsData.filter(
    (comment) => (comment["Session Id"] === sessionId && comment.Comment.trim().length >= 2),
  );
};

const findSessions = (speakerId: string): ISession[] => {
  return sessionData.filter((session) => {
    const speakerIds = session["Speaker Ids"].split(",");
    return speakerIds.includes(speakerId);
  });
};

const processRequest = async (): Promise<void> => {
  terminal("\nSpeaker email: ");
  const email = await terminal.inputField({
    cancelable: true,
  }).promise;
  if (!email) {
    return;
  }

  const speaker = findSpeaker(email.trim());
  if (speaker == null) {
    terminal.red.bold("Speaker not found!");
    return;
  }

  if (speaker["Are you based in South Africa?"]) {
    terminal.yellow("\n\nSpeaker is local");
  }

  const sessions = findSessions(speaker["Speaker Id"]);

  const talks: string[] = [];

  for (let index = 0; index < sessions.length; index++) {
    const session = sessions[index];

    const comments = findComments(session["Session Id"]).map((comment) => comment.Comment);
    const stats = getReviewStats(session["Session Id"]);
    const reviewerStats = getReviewerStats(session["Session Id"]);
    let notes = session["Owner Notes"] ?? "";
    if (notes.trim() === "") notes = "(no notes provided by the presenter)\n";

    terminal.bold.cyan(`\n\n${session.Title}`);
    terminal(`\n\n${session.Description}`);
    terminal.gray(`\n\nOutline:\n`).defaultColor(session["Talk Outline"]);
    terminal.gray(`\n\n.0.0.0.0.0.0.0.0.0.0.0.0.0.0.`);
    terminal.gray('\nTrack: ' + session.Theme)
    terminal.gray(`\n\Notes:\n`).defaultColor(notes);
    terminal.gray(`\n\Comments:\n`);
    for (let commentIndex = 0; commentIndex < comments.length; commentIndex++) {
      const comment = comments[commentIndex];

      terminal(`\n${comment}`);
    }

    terminal(`\n${JSON.stringify(stats)}`);
    terminal.grey(`\nFinal Rank: `).defaultColor(reviewerStats?.originalRank);
    terminal.grey(`\nReviewers Rank: `).defaultColor(reviewerStats?.reviewersRank.toSorted());

    if (session.Status === "Accepted") {
      terminal.brightGreen(`\nThis talk was accepted!`);
    }

    terminal.grey("\nFeedback:");

    const feedback = await terminal.inputField({
      cancelable: true,
    }).promise;

    let reviewerFeedback = "";
    if (comments.length > 0) {
      for (let commentIndex = 0; commentIndex < comments.length; commentIndex++) {
        const comment = comments[commentIndex];
        terminal(`\nInclude this feedback "${comment}" (Y/n): `);

        const add = await terminal.yesOrNo({
          yes: ["y", "Y", "ENTER"],
          no: ["n", "N"],
        }).promise;
        if (add) {
          reviewerFeedback += `<li>${comment}</li>\n`;
        }
      }
    }

    if (reviewerFeedback === "") {
      reviewerFeedback = "<li>No reviewer's feedback was provided during the review process for this submission.</li>";
    }

    talks.push(talkTemplate({
      title: session.Title,
      description: session.Description,
      outline: session["Talk Outline"],
      notes,
      rank: reviewerStats.originalRank + 1,
      reviewerFeedback,
      feedback,
      seen: stats.seen,
      hardNo: stats.hardNo,
      diamond: stats.diamond,
      average: reviewerStats.average,
      median: reviewerStats.median,
      reviewerRank: reviewerStats.reviewersRank.toSorted(),
    }));
  }

  const emailText = emailTemplate({
    firstName: speaker.FirstName,
    pluralS: talks.length > 1 ? "s" : "",
    talk1: talks[0],
    talk2: talks.length > 1 ? talks[1] : "",
    talk3: talks.length > 2 ? talks[2] : "",
  });

  await copyRichText(emailText);
};

const askForMore = async (): Promise<boolean> => {
  terminal("\nMore (Y/n): ");
  return (await terminal.yesOrNo({
    yes: ["y", "Y", "ENTER"],
    no: ["n", "N"],
  }).promise) ?? false;
};

while (true) {
  await processRequest();
  const more = await askForMore();
  if (!more) {
    terminal.processExit(0);
    break;
  }
}
