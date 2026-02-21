import { Resend } from "resend";
import OpenAI from "openai";
import Job from "../models/job.model.js";
import User from "../models/user.model.js"; // Assuming your user model is here

const resend = new Resend(process.env.RESEND_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const handleResendWebhook = async (req, res) => {
  try {
    const { data, type } = req.body;

    if (type !== "email.received") return res.sendStatus(200);

    const { data: emailContent, error } = await resend.emails.receiving.get(
      data.email_id,
    );
    if (error || !emailContent)
      throw new Error("Failed to fetch email from Resend");

    const senderEmail =
      emailContent.from.match(/<([^>]+)>/)?.[1] || emailContent.from;
    const user = await User.findOne({ email: senderEmail });

    if (!user) {
      // 👇 ADD THIS LINE TEMPORARILY
      console.log("DEBUG: Full Email Content from Google:", emailText);

      console.log(`Email received from unregistered address: ${senderEmail}`);
      return res.status(200).send("Unregistered sender");
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a job assistant. Extract the 'company', 'job_title', and 'location' from this email. Return strictly valid JSON.",
        },
        { role: "user", content: emailContent.text || emailContent.html },
      ],
      response_format: { type: "json_object" },
    });

    const aiParsed = JSON.parse(completion.choices[0].message.content);

    const newJob = await Job.create({
      userId: user._id,
      title: aiParsed.job_title || "New Application",
      company: aiParsed.company || "Unknown Company",
      location: aiParsed.location || null,
      status: "applied",
      source: "email",
      dateApplied: new Date(),
    });

    console.log(
      `✅ Auto-tracked job for ${user.email}: ${aiParsed.job_title} at ${aiParsed.company}`,
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Automation Webhook Error:", error.message);
    return res.status(500).send("Internal Webhook Error");
  }
};

export { handleResendWebhook };
