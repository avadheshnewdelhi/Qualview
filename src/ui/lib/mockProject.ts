/**
 * Mock Demo Project — "Mobile Onboarding UX Research"
 *
 * A realistic B2B SaaS mobile app onboarding research project
 * with 10 participants, full research pipeline, and 10 transcripts.
 */
import { v4 as uuidv4 } from 'uuid';
import type {
    ResearchContext,
    ResearchObject,
    FramingContent,
    PlanContent,
    ScreenerContent,
    InterviewGuideContent,
    InsightsContent,
    Transcript,
} from '@/types';

// ─── Context ───────────────────────────────────────────────────────────────

const MOCK_CONTEXT: ResearchContext = {
    sources: [
        {
            id: uuidv4(),
            type: 'manual',
            content: `Product Brief — TaskFlow Mobile App\n\nTaskFlow is a B2B project management SaaS serving mid-market companies (50–500 employees). We launched a native mobile app 6 months ago. Current mobile adoption sits at 23% of our desktop user base — well below the 45% industry benchmark.\n\nKey metrics:\n- Day-1 retention: 34% (target: 60%)\n- Onboarding completion: 41% (target: 75%)\n- Time-to-first-value: 8.2 minutes (target: 3 minutes)\n- Support ticket volume for mobile: 340/month (3× desktop ratio)\n\nHypotheses:\n1. The onboarding flow assumes desktop familiarity, which new-to-TaskFlow mobile users lack.\n2. Push notification permissions are requested too early, causing drop-off.\n3. The workspace join flow on mobile is confusing because enterprise SSO redirects break the in-app experience.\n\nStakeholders: Product (Sarah Chen), Engineering (Marcus Ali), Design (Priya Patel), CS (Jordan Blake)\nTimeline: 4 weeks for research, insights due end of Q1 2026\nBudget: $12,000`,
            metadata: { timestamp: Date.now() - 86400000, fileName: 'product-brief.md' },
        },
        {
            id: uuidv4(),
            type: 'file',
            content: `Competitive Analysis — Mobile Onboarding Patterns\n\nAnalyzed 5 competitors: Asana, Monday.com, ClickUp, Notion, Linear.\n\nKey findings:\n- All 5 use progressive disclosure in mobile onboarding (vs TaskFlow's linear wizard).\n- 4/5 defer push notification permissions until after first task completion.\n- 3/5 offer a "sample project" to explore before requiring workspace setup.\n- Only Linear uses SSO-first flow on mobile; others provide email/password fallback.\n- Average onboarding steps: 4 (vs TaskFlow's 7).\n- Notion's "empty state guidance" pattern scored highest in user satisfaction surveys.\n\nRecommendation: Investigate which patterns resonate with our user segments before redesigning.`,
            metadata: { timestamp: Date.now() - 172800000, fileName: 'competitive-analysis.pdf', fileType: 'application/pdf' },
        },
    ],
    normalizedSummary: 'B2B SaaS mobile app (TaskFlow) with poor onboarding metrics: 34% day-1 retention, 41% completion rate, 8.2min time-to-first-value. Investigating onboarding friction, push notification timing, and SSO flow issues. 4-week timeline, $12k budget.',
    lastUpdated: Date.now(),
};

// ─── Framing ───────────────────────────────────────────────────────────────

const framingId = uuidv4();
const MOCK_FRAMING: ResearchObject<FramingContent> = {
    id: framingId,
    type: 'framing',
    content: {
        researchType: 'Generative / Exploratory',
        rationale: 'With only 23% mobile adoption and 41% onboarding completion, we need to understand *why* users struggle — not just *where* they drop off. Analytics tell us the "what" but not the motivations, mental models, and emotional responses that drive behaviour. A generative approach will surface unexpected friction points and uncover user expectations about mobile-first project management that our team may not have considered.',
        willAnswer: [
            'What mental models do users bring from desktop when opening the mobile app for the first time?',
            'Where do users experience confusion, frustration, or hesitation during mobile onboarding?',
            'What information or actions do users expect to be available on mobile vs desktop?',
            'How does the SSO/workspace join experience compare to user expectations on mobile?',
            'What role does push notification permission play in the user\'s trust and engagement decision?',
        ],
        willNotAnswer: [
            'Exact conversion rates for specific UI changes (requires A/B testing)',
            'Whether the mobile app should be feature-parity with desktop (strategic decision)',
            'Technical feasibility of proposed onboarding changes',
            'Pricing-related adoption barriers (out of scope)',
        ],
        assumptions: [
            'Users who adopted desktop TaskFlow have different onboarding needs than net-new mobile users',
            'Enterprise SSO is a significant friction point specific to mobile (not present on desktop)',
            'Push notification rejection correlates with lower retention, but causality is unproven',
            'Participants with B2B SaaS experience will provide richer comparative feedback',
        ],
    },
    confidence: 'high',
    improvementSuggestions: [
        'Consider adding a "diary study" component to track onboarding over multiple days',
        'Include accessibility considerations for mobile onboarding (screen readers, one-handed use)',
        'Investigate whether IT admin vs end-user onboarding differs significantly',
    ],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
};

// ─── Plan ──────────────────────────────────────────────────────────────────

const planId = uuidv4();
const MOCK_PLAN: ResearchObject<PlanContent> = {
    id: planId,
    type: 'plan',
    content: {
        goal: 'Identify the key friction points, unmet expectations, and emotional barriers in TaskFlow\'s mobile onboarding experience, and surface opportunities for redesign that would improve day-1 retention from 34% to 60%.',
        approach: 'Semi-structured interviews with 10 participants, combining retrospective walkthroughs of their actual onboarding experience with live task-based observation of key onboarding flows. Each session will be 45–60 minutes via video call with mobile screen sharing. We will recruit a mix of existing desktop users trying mobile for the first time and net-new mobile users.',
        focusAreas: [
            'First-launch experience: expectations, impressions, and emotional response within the first 2 minutes',
            'Workspace setup & SSO flow: where confusion arises, workarounds users create, and comparison to other tools',
            'Push notification permission request: timing, framing, and its impact on trust',
            'Navigation and information architecture: whether users can find what they need and complete a basic task',
        ],
        risksAndLimitations: [
            'Retrospective accounts of onboarding may be affected by recall bias — mitigated by combining with live observation',
            'Recruiting enterprise users with SSO experience may take longer than individual users',
            'Mobile screen sharing quality varies across devices and platforms — will provide backup recording instructions',
        ],
    },
    confidence: 'high',
    improvementSuggestions: [
        'Add a pre-interview survey to capture device usage patterns and tool familiarity',
        'Consider a short unmoderated task to warm up participants before the interview',
        'Plan for a mid-study debrief with stakeholders to adjust probing areas if needed',
    ],
    createdAt: Date.now() - 3200000,
    updatedAt: Date.now() - 3200000,
};

// ─── Screener ──────────────────────────────────────────────────────────────

const screenerId = uuidv4();
const MOCK_SCREENER: ResearchObject<ScreenerContent> = {
    id: screenerId,
    type: 'screener',
    content: {
        questions: [
            {
                id: 'q1',
                question: 'Imagine you\'re starting a new role and your team uses a project management tool you\'ve never used before. Walk me through how you\'d typically get set up on your phone.',
                questionType: 'scenario',
                options: ['Open-ended response'],
            },
            {
                id: 'q2',
                question: 'Which of these tools have you used for work in the past 6 months? (Select all that apply)',
                questionType: 'indirect',
                options: ['Asana', 'Monday.com', 'ClickUp', 'Notion', 'Linear', 'Jira', 'Trello', 'Microsoft Planner', 'None of these'],
            },
            {
                id: 'q3',
                question: 'How does your company typically set up accounts for new software tools?',
                questionType: 'indirect',
                options: ['I sign up with my work email', 'IT sends me a login link (SSO/Okta/Azure AD)', 'A colleague invites me', 'I\'m not sure — it just appears', 'Other'],
            },
            {
                id: 'q4',
                question: 'Think about the last mobile work app you installed. How long did it take before you felt confident using it?',
                questionType: 'scenario',
                options: ['Less than 5 minutes', '5–15 minutes', '15–30 minutes', 'More than 30 minutes', 'I never felt confident', 'I deleted it before getting there'],
            },
            {
                id: 'q5',
                question: 'How many people are in your immediate team at work?',
                questionType: 'validation',
                options: ['1–10', '11–50', '51–200', '200+'],
                knockoutLogic: 'Disqualify if "1–10" — we need mid-market participants',
            },
            {
                id: 'q6',
                question: 'In the past month, which of these have you done on a mobile device for work? (Select all that apply)',
                questionType: 'knockout',
                options: ['Checked project status', 'Assigned a task', 'Commented on a task', 'Created a new project', 'Approved a request', 'None of these'],
                knockoutLogic: 'Disqualify if "None of these" — need active mobile work users',
            },
        ],
    },
    confidence: 'high',
    improvementSuggestions: [
        'Add a question about device type (iOS vs Android) for segment analysis',
        'Consider asking about accessibility needs for inclusive recruitment',
    ],
    createdAt: Date.now() - 2800000,
    updatedAt: Date.now() - 2800000,
};

// ─── Interview Guide ───────────────────────────────────────────────────────

const interviewId = uuidv4();
const MOCK_INTERVIEW: ResearchObject<InterviewGuideContent> = {
    id: interviewId,
    type: 'interview-guide',
    content: {
        sections: [
            {
                type: 'warmup',
                questions: [
                    {
                        id: 'w1',
                        question: 'Tell me about a typical workday. How do you use your phone for work tasks?',
                        probes: ['What apps do you reach for first?', 'What do you prefer doing on mobile vs desktop?'],
                        notes: 'Build rapport and understand baseline mobile work habits.',
                    },
                    {
                        id: 'w2',
                        question: 'Think about the last time you tried a new work app on your phone. What was that experience like?',
                        probes: ['What made it easy or hard?', 'Did anything surprise you?'],
                    },
                ],
            },
            {
                type: 'core',
                questions: [
                    {
                        id: 'c1',
                        question: 'Walk me through what happened when you first opened TaskFlow on your phone.',
                        probes: ['What did you expect to see?', 'What was your first impression?', 'At what point did you feel oriented — or did you?'],
                        notes: 'Key question. Listen for expectation gaps and emotional cues.',
                    },
                    {
                        id: 'c2',
                        question: 'Describe the process of joining your workspace on mobile. What happened step by step?',
                        probes: ['Were there any points where you got stuck?', 'Did you have to switch to another device or app?', 'How did SSO/login work for you?'],
                    },
                    {
                        id: 'c3',
                        question: 'You mentioned [push notifications / permissions]. Tell me more about what you were thinking at that moment.',
                        probes: ['What information would have made you more comfortable?', 'Have other apps handled this differently in a way you preferred?'],
                    },
                    {
                        id: 'c4',
                        question: 'Show me how you would create a task and assign it to a teammate right now.',
                        probes: ['What are you looking for?', 'Is this what you expected?', 'How does this compare to doing it on desktop?'],
                        notes: 'Live observation task. Note hesitations, wrong taps, and verbal reactions.',
                    },
                    {
                        id: 'c5',
                        question: 'If you could change one thing about getting started with TaskFlow on mobile, what would it be?',
                        probes: ['Why that specifically?', 'What would the ideal experience look like?'],
                    },
                ],
            },
            {
                type: 'wrapup',
                questions: [
                    {
                        id: 'wp1',
                        question: 'On a scale of 1–10, how likely are you to continue using TaskFlow on your phone? What drives that number?',
                        probes: ['What would move that number up or down?'],
                    },
                    {
                        id: 'wp2',
                        question: 'Is there anything else about your mobile onboarding experience that we haven\'t covered but you think is important?',
                        probes: [],
                        notes: 'Leave space for unexpected insights.',
                    },
                ],
            },
        ],
    },
    confidence: 'high',
    improvementSuggestions: [
        'Add a question about collaboration features discovery on mobile',
        'Consider asking about offline expectations for mobile usage',
    ],
    createdAt: Date.now() - 2400000,
    updatedAt: Date.now() - 2400000,
};

// ─── Insights ──────────────────────────────────────────────────────────────

const insightsId = uuidv4();
const MOCK_INSIGHTS: ResearchObject<InsightsContent> = {
    id: insightsId,
    type: 'insights',
    content: {
        themes: [
            {
                id: 't1',
                name: 'Desktop-First Mental Model Mismatch',
                description: 'Users who adopted TaskFlow on desktop applied desktop-specific mental models to mobile, expecting identical layouts and navigation patterns. This created a cognitive gap that the current mobile onboarding doesn\'t bridge.',
                insightIds: ['i1', 'i2'],
            },
            {
                id: 't2',
                name: 'SSO/Workspace Join Friction',
                description: 'Enterprise SSO flows broke the in-app experience, forcing context switches to browsers and email. Participants described this as "the wall" — most drop-offs occurred at this step.',
                insightIds: ['i3', 'i4'],
            },
            {
                id: 't3',
                name: 'Permission Timing & Trust',
                description: 'Push notification and other system permission requests made before users understood the app\'s value were perceived as invasive. Timing of permissions directly impacted trust formation.',
                insightIds: ['i5', 'i6'],
            },
            {
                id: 't4',
                name: 'Time-to-First-Value Gap',
                description: 'Users needed to complete too many setup steps before they could perform a meaningful action. The gap between "opening the app" and "doing something useful" was too wide, especially compared to competitors.',
                insightIds: ['i7', 'i8'],
            },
        ],
        insights: [
            {
                id: 'i1',
                statement: 'Users expected the mobile app to mirror the desktop sidebar navigation, causing disorientation when encountering the tab-based mobile layout.',
                evidence: [
                    { quote: "I kept looking for the sidebar. On desktop, everything is on the left. Here I couldn't find my projects.", participantId: "P2", emotion: "confused", sentiment: "negative", tags: ["navigation", "layout"] },
                    { quote: "It felt like a completely different product. I had to relearn everything.", participantId: "P5", emotion: "frustrated", sentiment: "negative", tags: ["learning-curve"] },
                    { quote: "I actually thought I was in the wrong workspace because the layout was so different.", participantId: "P8", emotion: "lost", sentiment: "negative", tags: ["navigation"] }
                ],
                strength: 'strong',
                severity: 'high',
                confidenceScore: 92
            },
            {
                id: 'i2',
                statement: 'Net-new mobile users (no prior desktop experience) completed onboarding 2.3× faster and reported less confusion than desktop-first users.',
                evidence: [
                    { quote: "I just followed the steps. It was pretty straightforward — kind of like setting up Slack.", participantId: "P3", emotion: "relaxed", sentiment: "positive", tags: ["onboarding", "comparison"] },
                    { quote: "I didn't know what to expect, so I just went with the flow. It was fine.", participantId: "P9", emotion: "neutral", sentiment: "neutral", tags: ["onboarding"] }
                ],
                strength: 'moderate',
                severity: 'low',
                confidenceScore: 78
            },
            {
                id: 'i3',
                statement: 'SSO redirects to external browsers caused 7 of 10 participants to lose their place in onboarding, with 3 having to restart the process entirely.',
                evidence: [
                    { quote: "It kicked me out to Safari, then I had to approve something in Okta, and when I came back the app had reset.", participantId: "P1", emotion: "annoyed", sentiment: "negative", tags: ["sso", "authentication"] },
                    { quote: "I honestly thought it crashed. I closed everything and started over.", participantId: "P4", emotion: "frustrated", sentiment: "negative", tags: ["crash", "sso"] },
                    { quote: "The SSO thing took me to a browser and I couldn't get back. I had to ask IT for help.", participantId: "P7", emotion: "helpless", sentiment: "negative", tags: ["sso", "support"] }
                ],
                strength: 'strong',
                severity: 'critical',
                businessImpact: 'high',
                confidenceScore: 95
            },
            {
                id: 'i4',
                statement: 'Participants who joined workspaces via email invite link had a significantly smoother experience than those who used SSO or manual workspace ID entry.',
                evidence: [
                    { quote: "My colleague sent me a link. I tapped it, the app opened, and I was in. Easy.", participantId: "P6", emotion: "delighted", sentiment: "positive", tags: ["invitation", "seamless"] },
                    { quote: "I wish I could just click a link instead of typing in my company's workspace ID.", participantId: "P10", emotion: "hopeful", sentiment: "neutral", tags: ["feature-request", "login"] }
                ],
                strength: 'moderate',
                severity: 'low',
                confidenceScore: 82
            },
            {
                id: 'i5',
                statement: 'All 10 participants who saw the push notification permission request within the first 60 seconds either denied or dismissed it. The 3 who received it after completing their first task all allowed it.',
                evidence: [
                    { quote: "Why does it need to send me notifications? I haven't even done anything yet.", participantId: "P1", emotion: "skeptical", sentiment: "negative", tags: ["permissions", "trust"] },
                    { quote: "I always say no to these. If it asks again later and I see the point, maybe.", participantId: "P6", emotion: "defensive", sentiment: "neutral", tags: ["permissions", "habit"] },
                    { quote: "After I created my first task, it asked about notifications and I thought, yeah, I should know when someone comments.", participantId: "P10", emotion: "understanding", sentiment: "positive", tags: ["permissions", "timing"] }
                ],
                strength: 'strong',
                severity: 'medium',
                confidenceScore: 88
            },
            {
                id: 'i6',
                statement: 'Participants associated early permission requests with spam and marketing, not with functional utility — even when the request text explained the purpose.',
                evidence: [
                    { quote: "Every app does this to send you junk. I just swipe it away.", participantId: "P3", emotion: "cynical", sentiment: "negative", tags: ["spam", "permissions"] },
                    { quote: "I read the text but I didn't trust it. They all say that.", participantId: "P7", emotion: "distrustful", sentiment: "negative", tags: ["trust", "copy"] }
                ],
                strength: 'moderate',
                severity: 'medium',
                confidenceScore: 75
            },
            {
                id: 'i7',
                statement: 'The current 7-step onboarding wizard creates a "setup fatigue" effect. Participants who skipped to exploring the app (possible only via a hidden "skip" link) reported higher satisfaction.',
                evidence: [
                    { quote: "By step 4, I was losing patience. I just wanted to see my projects.", participantId: "P2", emotion: "impatient", sentiment: "negative", tags: ["fatigue", "onboarding"] },
                    { quote: "I found a tiny 'skip' link at the bottom. Best decision ever. I figured the rest out on my own.", participantId: "P5", emotion: "relieved", sentiment: "positive", tags: ["skip", "exploration"] },
                    { quote: "Seven steps is too many for a phone. On desktop it's fine because the screen is big, but on mobile it feels endless.", participantId: "P8", emotion: "exhausted", sentiment: "negative", tags: ["fatigue", "device-context"] }
                ],
                strength: 'strong',
                severity: 'high',
                businessImpact: 'medium',
                confidenceScore: 91
            },
            {
                id: 'i8',
                statement: 'Participants who could see a "sample project" or demo data during onboarding reported faster understanding of the app\'s value proposition and higher intent to continue using it.',
                evidence: [
                    { quote: "If there was a fake project already there, I could just poke around and see what it does.", participantId: "P4", emotion: "curious", sentiment: "neutral", tags: ["demo", "exploration"] },
                    { quote: "Notion does this. They give you a 'Getting Started' page and you just explore. I wish TaskFlow did that.", participantId: "P9", emotion: "wistful", sentiment: "neutral", tags: ["comparison", "demo"] }
                ],
                strength: 'moderate',
                severity: 'low',
                confidenceScore: 85
            }
        ],
        opportunities: [
            'Implement progressive disclosure onboarding: reduce initial steps from 7 to 3, let users explore first and complete setup gradually',
            'Defer push notification request until after the user completes their first meaningful action (create task, comment, or check status)',
            'Add an in-app SSO flow using ASWebAuthenticationSession (iOS) or Custom Tabs (Android) to prevent browser-based context switches',
            'Create a "sample workspace" onboarding path for new users, pre-populated with realistic demo data to explore before joining their team workspace',
        ],
        hmwPrompts: [
            'How might we bridge the gap between desktop and mobile mental models without forcing desktop patterns onto mobile?',
            'How might we make the SSO join flow feel seamless and in-app rather than a detour through the browser?',
            'How might we earn notification permission trust by demonstrating value first?',
        ],
    },
    confidence: 'high',
    improvementSuggestions: [
        'Quantify the impact of each friction point with analytics data to prioritise opportunities',
        'Validate the "sample workspace" concept with a quick prototype test before full build',
        'Consider longitudinal follow-up to see if the improvements sustain engagement beyond day 1',
    ],
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
};

// ─── Transcripts (10 × ~1000 words) ────────────────────────────────────────

const MOCK_TRANSCRIPTS: Omit<Transcript, 'id'>[] = [
    {
        name: 'P1 — Lisa Chen (Product Manager, 150-person fintech)',
        content: `Interviewer: Tell me about a typical workday. How do you use your phone for work tasks?

Lisa: My mornings are chaos — I wake up and immediately check Slack on my phone, then email, then our project tracker. On mobile I mostly consume — reading updates, checking timelines, approving things. I rarely create content on mobile because typing is slow and I can't see the full picture. But I need to stay on top of things during commutes and between meetings. I'd say 30% of my work interaction is mobile, but it's all lightweight stuff.

Interviewer: Walk me through what happened when you first opened TaskFlow on your phone.

Lisa: So I'd been using TaskFlow on desktop for about three months already. My manager mentioned there was a mobile app, so I downloaded it during lunch. When I opened it, the first thing I saw was a login screen. I used my work email, it said "sign in with SSO," and then... it launched Safari. I was already annoyed because I expected it to stay in the app. Safari opened our Okta page, I authenticated, then it tried to redirect back to TaskFlow, but the app seemed to reload from scratch. My projects weren't showing at first — there was this blank screen for maybe 10 seconds, then they loaded. My first impression was honestly "this is rough."

Interviewer: What did you expect to see after logging in?

Lisa: I expected to see my projects right away, like on desktop. Instead, I got this onboarding wizard — "Welcome! Let's set up your mobile experience" with 7 steps. I thought, I already set this up on desktop. Why am I doing this again? The first step asked me to "choose my workspace." I only have one workspace. Why is it asking? Step two was about setting a profile photo — I already have one. Step three asked about notification preferences. I declined because I wasn't ready to commit to notifications from a tool I hadn't used on mobile yet. Then there were steps about pinning favourite projects, setting up widgets, and some tutorial. By step five, I was looking for a skip button.

Interviewer: Did you find a way to skip?

Lisa: There was a tiny "Skip" link at the bottom of step six. I almost missed it. After I tapped it, I finally saw my dashboard. But it looked nothing like the desktop. On desktop, there's a sidebar with all my projects grouped by team. On mobile, it was these tabs at the bottom — Home, My Tasks, Search, More. I spent a good two minutes just trying to find the project I was actively working on. I eventually found it under "More > All Projects." Not intuitive at all.

Interviewer: Tell me about the notification permission request. What were you thinking?

Lisa: It popped up during step three of the wizard, before I'd seen any of my actual content. The exact text was something like "TaskFlow would like to send you notifications for task updates and messages." I instinctively declined. It's not that I don't want notifications — I actually would want to know when someone assigns me a task — but the timing was wrong. I hadn't seen the value yet. If it asked me later, after I'd used the app for a day and realised how useful mobile notifications would be, I would have said yes.

Interviewer: If you could change one thing about getting started with TaskFlow on mobile, what would it be?

Lisa: Skip the wizard entirely for existing users. Just log me in and show me my stuff. Let me discover features organically. On desktop, I learned by doing — nobody forced a 7-step tutorial on me. Mobile should be even simpler, not more complex. Oh, and fix the SSO redirect. It should never leave the app.

Interviewer: On a scale of 1–10, how likely are you to continue using TaskFlow on your phone?

Lisa: I'd say 6. I use it now, but reluctantly. The initial experience left a bad taste, and I still don't find the mobile navigation intuitive. If they fixed the onboarding and made navigation feel more natural, I'd bump that to an 8 easily.`,
    },
    {
        name: 'P2 — Marcus Williams (Design Lead, 200-person healthtech)',
        content: `Interviewer: Tell me about how you use your phone for work tasks.

Marcus: I'm a designer, so most of my real work happens on desktop with Figma. But my phone is crucial for quick reviews, Slack conversations, and checking project updates when I'm in workshops or user testing sessions. I'd say I check work apps on mobile maybe 15 times a day, but each session is short — under two minutes.

Interviewer: Walk me through your first experience opening TaskFlow mobile.

Marcus: I've been on TaskFlow desktop for a year. The mobile app, I downloaded it because our PM kept asking us to update task statuses even when we're not at our desks. When I opened it, the login was fine — we use Google Workspace, so it was just a Google sign-in, no SSO drama. But then the onboarding wizard started, and man, it felt exhausting. Seven steps on a phone screen. I kept swiping, looking for the end.

The biggest issue was the layout. On desktop, I have my sidebar with teams, projects nested under teams, and I can see the board view of tasks. On mobile, it was completely flat. The bottom tab bar had Home, My Tasks, Inbox, and More. "My Tasks" was useful, but I couldn't find the project board view at all. I kept looking for the sidebar. There's no sidebar on mobile, which I understand from a design perspective, but the app didn't help me understand the new navigation model.

Interviewer: What was your emotional response during this process?

Marcus: Frustration, honestly. As a designer, I was critical because I knew they could do better. The wizard felt like it was designed for desktop and shrunk down for mobile. The steps were long — each one had paragraphs of text explaining features. On mobile, nobody reads paragraphs. You need visual cues, maybe animations showing how things work, not walls of text.

Interviewer: Show me how you would create a task right now.

Marcus: OK, so... I'm on the Home tab. I see recent projects. I'll tap into "Product Redesign Q1." OK, I'm in the project. I see a list view. Where's the add button? I'm looking for a floating action button maybe... Ah, there's a tiny "+" in the header. That's hard to reach with one hand. OK, I tapped it. Now there's a form with title, description, assignee, due date, tags, priority, project section... This is a lot for mobile. On desktop, I can just type a title and hit Enter, then add details later. Here, the full form is the only option. Let me type a title... "Review icon set." OK, now I need to find the assignee... It's showing all 200 people alphabetically. There's a search, at least. Let me type "Priya"... Found her. Assign. Save. That took about 45 seconds. On desktop, it would take 10.

Interviewer: What would make the mobile experience better?

Marcus: Three things. One, let me create a task with just a title — quick add, like a text message. Two, use the visual language of mobile — floating action button, gesture-based navigation, progressive disclosure. Three, onboarding should be "learn by doing" — give me a sample task and let me interact with it instead of reading paragraphs about features.

Interviewer: Scale of 1–10, how likely to continue?

Marcus: 5. I use it because I have to, not because I want to. If the task creation was faster and navigation was more intuitive, it could be an 8.`,
    },
    {
        name: 'P3 — Aisha Patel (Customer Success Manager, 80-person edtech startup)',
        content: `Interviewer: How do you typically use your phone for work?

Aisha: Constantly. I'm in and out of meetings all day, so my phone is my lifeline. I respond to customer Slack messages, check our support dashboard, update CRM notes — all on mobile. I'd say 50% of my work interaction happens on my phone. I'm very comfortable with mobile work apps.

Interviewer: Tell me about your first experience with TaskFlow mobile.

Aisha: I'm actually new to TaskFlow entirely — I've never used the desktop version. My team switched from Trello two weeks ago, and I decided to start on mobile because that's where I'd be using it most. When I opened the app, the first screen asked me to create an account or join a workspace. My team lead sent me a workspace invite link, so I tapped that from email, and the app opened with everything mostly set up. I had to set a password and choose a profile photo — that took maybe 90 seconds. Then I was in.

Interviewer: That sounds smoother than what we've heard from other participants. Why do you think that is?

Aisha: Probably because I got a direct invite link. I didn't have to type in a workspace ID or go through SSO. The link just... worked. Also, since I'd never used the desktop version, I didn't have expectations about what the mobile app "should" look like. I just explored the tabs and figured it out. The Home tab made sense — it showed recent activity. My Tasks showed my assigned items. I found my project under the search tab.

Interviewer: Was there anything confusing or unexpected?

Aisha: A couple things. First, the notification permission came up right after I set my password — before I'd even seen a single task. I declined because I didn't know what it would notify me about. Second, the onboarding tutorial was three steps for me (shorter than the full wizard, maybe because I came in via invite?), but one of the steps was about "boards vs lists vs timeline view." I had no idea what that meant since I hadn't seen any tasks yet. It was explaining features in the abstract. I learn by doing, not by reading descriptions.

Interviewer: Show me how you'd check on a task assigned to you.

Aisha: I go to My Tasks... Here it is, "Prepare Q1 review deck." I tap it. I see the title, description, due date, who assigned it. I can add a comment. I can change the status... this is actually pretty clean. On Trello mobile, I had to scroll way more. This is more compact. I like that the comment bar is sticky at the bottom — it's like messaging.

Interviewer: If you could change one thing?

Aisha: Ask me about notifications after I've been using the app for a day. By then, I'd understand what notifications would be useful. Right now, I have no notifications on and I keep missing task assignments because I forget to check the app. I'd definitely allow notifications if it asked me right after someone assigned me a task — that would be the perfect "aha, I need this" moment.

Interviewer: Scale of 1–10?

Aisha: 7. It's pretty good for a mobile work app, honestly. The Trello transition was smooth. But the notification thing cost them — I've missed important updates because I'm not getting push alerts.`,
    },
    {
        name: 'P4 — David Kowalski (Engineering Manager, 300-person logistics company)',
        content: `Interviewer: Tell me about your workday and phone usage.

David: Most of my day is code reviews, architecture discussions, and sprint planning — all desktop stuff. My phone is mainly for Slack, checking on build statuses, and occasionally approving PRs. I'm not a heavy mobile work user, maybe 15-20% of my work interaction.

Interviewer: Walk me through TaskFlow mobile — your first experience.

David: We'd been on TaskFlow desktop for about six months. I downloaded the mobile app because I wanted to check sprint burndown during a meeting. The login was the worst part. We use Azure AD, and the SSO flow is painful. The app opened Edge browser (not even my preferred browser), then it redirected through Microsoft's auth, then 2FA, then back to the app. Except the app didn't pick up the auth token properly. I got a blank screen. I force-closed and reopened. Blank screen again. I had to uninstall, reinstall, and go through the entire SSO flow again. The second time it worked.

Interviewer: That sounds incredibly frustrating. What happened next?

David: Honestly, by that point my meeting was over and I'd wasted 10 minutes. But I was determined. So I went through the setup wizard. Step 1: choose workspace — fine. Step 2: profile photo — skip. Step 3: notifications — I said no because I was annoyed. Step 4: pin favourite projects — OK, this was actually useful, I pinned my team's sprint board. Step 5: set up the Today widget — I don't use widgets. Step 6: something about integrations — skip. Step 7: "You're all set!" Finally.

Then I tried to find the sprint burndown chart. It's on the project dashboard on desktop. On mobile, I went to the project, and... there was no dashboard view. Just a list of tasks. I later found out the burndown chart is only on desktop. That was the entire reason I downloaded the app.

Interviewer: How did that make you feel?

David: Like I'd wasted 15 minutes setting up an app that doesn't even do what I needed. If the onboarding had said upfront "these features are desktop-only," I could have decided whether mobile was worth it for me. Instead, it set expectations that weren't met.

Interviewer: Show me how you'd check sprint progress on mobile.

David: I can show you, but it won't work. I'll go to my project... tap into "Platform API v2"... I see tasks, that's it. No charts, no progress bars, no velocity metrics. I can count tasks manually — 18 done, 7 in progress, 4 to do — but that's not the same as a burndown. For an engineering manager, the desktop features are critical. Mobile is just a dumbed-down task list.

Interviewer: What would make this better?

David: Two things. First, fix the SSO. It should never leave the app — Apple and Android both have in-app authentication frameworks. Use them. Second, be honest about what mobile can and can't do. Either bring the dashboard to mobile, or tell me upfront that "mobile is for quick task management, not project analytics." Set my expectations correctly.

Interviewer: Scale of 1–10?

David: 3. I basically don't use it anymore. The SSO experience was so bad and the missing dashboards made it useless for my actual needs. If they fixed SSO and added even basic charts, I'd reconsider.`,
    },
    {
        name: 'P5 — Sarah Nguyen (Product Marketing Manager, 120-person B2B SaaS)',
        content: `Interviewer: How do you use your phone for work?

Sarah: Heavily. I travel a lot for events and conferences, so mobile is my primary device for days at a time. I write emails, review documents, manage campaigns, check analytics — all on mobile. I'd say during travel weeks, 80% of my work is mobile.

Interviewer: Walk me through your first experience with TaskFlow mobile.

Sarah: I started on desktop three months ago when our whole marketing team switched from ClickUp. I knew the mobile app existed but waited until my first conference trip to download it. My experience was... mixed. Login was OK — we use Google Workspace, so it was just my Google account. But then the wizard started. Step one asked me to choose my workspace, which showed two options — our company workspace and a personal workspace I'd accidentally created months ago. I tapped the wrong one first and had to go back. Already annoyed.

The real problem was step three — the notification preferences. It showed me six types of notifications: task assignments, comments, due dates, status changes, mentions, and digest summaries. Each one had an on/off toggle. On a phone, that's overwhelming. I didn't know which ones I'd want because I hadn't used the app yet. I just toggled the first two on and moved on. In hindsight, I should have turned on mentions too because I missed a critical pre-launch mention from my designer and only saw it when I got back to my laptop.

Interviewer: What about the navigation — how did you find things?

Sarah: After the wizard, the app opened to a Home screen with a feed of recent activity. This was actually nice — it showed task updates from my team, similar to a Slack channel. But I needed to find a specific project — our "Q1 Product Launch" board. I went to search, typed it in, found it. The search works well. But I noticed the board didn't have a Kanban view on mobile. On desktop, I live in Kanban. On mobile, it's just a list. I can sort by status, which approximates Kanban, but it's not the same visual experience. That was disappointing.

Interviewer: You mentioned a "skip" link earlier. Can you tell me about that?

Sarah: Oh, right. During the wizard, around step five or six, I noticed a small "Skip for now" text at the very bottom of the screen. It was gray text on a white background — barely visible. I tapped it and it jumped me to the app. Looking back, if that skip option was more prominent — maybe even a button — I would have used it at step one. The wizard was clearly designed for new users, not experienced desktop users setting up mobile.

Interviewer: If you could redesign the onboarding, what would you do?

Sarah: For desktop users, skip the wizard entirely. Just check: do they have projects? Do they have a profile? If yes, just show them the app with a few contextual tooltips — "Swipe left to change status," "Tap and hold to reorder." Learn by doing. For the notification permissions, let me pick them granularly later in settings, and just ask the single iOS system prompt after I've used the app for a day.

Interviewer: Scale of 1–10?

Sarah: 7. I use it regularly during travel. The core task management works. But the onboarding was unnecessarily painful and I still miss the Kanban view. If they added Kanban on mobile, it'd be a 9.`,
    },
    {
        name: 'P6 — James Okafor (Operations Lead, 250-person supply chain company)',
        content: `Interviewer: Tell me about your typical phone usage for work.

James: It's constant. I manage warehouse operations, so I'm away from my desk most of the day — walking floors, in trucks, at loading docks. My phone is literally how I manage my team. I assign tasks, check completion rates, send updates to management. Probably 70% of my work happens on mobile. Battery life is a real concern — I carry a power bank everywhere.

Interviewer: How did you start with TaskFlow on mobile?

James: My company rolled out TaskFlow two months ago. The implementation team sent us invite links by email. I tapped the link on my phone — it opened the app store since I didn't have the app yet. I installed it, then tapped the link again. The app opened and I was in my workspace immediately. No SSO issues because the invite link had some kind of auth token baked in. It was genuinely smooth.

Interviewer: That's interesting — you had an invite link experience. What happened next?

James: There was a short setup — name, profile photo, notification preferences. I think it was three steps, not seven. Maybe because I came in through the invite link? I don't know. But it was quick. I turned on all notifications because I need to be responsive — if someone marks a delivery as "delayed," I need to know immediately.

The app opened to my Home tab. I could see my team's tasks. The list view was clean. Each task showed the title, assignee, status, and due date. For my use case, this is perfect. I don't need Kanban boards or fancy views. I need to see: what's late, what's in progress, who's doing what. And the app shows that clearly.

Interviewer: Were there any friction points?

James: A few. First, creating tasks requires too many fields. When I'm standing at a dock and need to quickly log "Unload Container #4827," I don't want to fill out priority, due date, tags, section, and description. I just need title and assignee. But the creation form shows everything, and the required fields aren't clear. I accidentally skipped the assignee once and had to edit it after.

Second, the search only searches task titles, not descriptions or comments. I once searched for a container number that was in a task description, and search didn't find it. I had to scroll through 50 tasks manually.

Third, I wish there was an offline mode. In warehouses, cell reception can be spotty. If I lose signal, the app shows a loading spinner and I can't see any tasks. Even cached tasks would be helpful.

Interviewer: Show me how you'd assign a task to someone right now.

James: I'll hit the plus button... wait, where is it? [scrolls] Oh, it's up in the header. I always forget — I expect a floating button at the bottom right. OK, plus. Title: "Check forklift maintenance." Assignee: I search "Roberto"... found him. Priority — I'll set medium. Due date... today. Save. Done. That took 30 seconds. If there was a quick-add mode — just title and one-tap assignee — it could be 5 seconds.

Interviewer: Scale of 1–10?

James: 8. For my use case, it works. My team status updates flow in real-time through notifications. The core experience is solid. I want quick-add and offline mode, but I can live without them. The fact that the invite link worked so smoothly set a great first impression, and that carried me through the minor annoyances.`,
    },
    {
        name: 'P7 — Emily Thornton (HR Director, 180-person professional services firm)',
        content: `Interviewer: Tell me about your work and mobile usage.

Emily: I lead HR for a consulting firm. My days are split between meetings, policy work, and employee conversations. I use my phone mostly reactively — responding to Slack messages, checking our HRIS, approving PTO requests. Maybe 25% of my interaction is mobile, but it's important that mobile works well because those moments are often time-sensitive.

Interviewer: Walk me through trying TaskFlow on mobile.

Emily: We adopted TaskFlow for cross-functional project management about four months ago. I'm primarily a desktop user but downloaded mobile because I needed to approve some tasks while traveling. The login was... memorable, and not in a good way. We use Okta for SSO. I opened the app, tapped "Sign in with SSO," entered my company email, and it redirected to a browser. Okta loaded, I entered my password, then came the MFA — I had to approve on the Okta Verify app, which meant switching apps. Then Okta redirected back to TaskFlow, but the redirect failed. The app showed a generic error: "Something went wrong. Please try again."

I tried three more times. Same result. I eventually Googled "TaskFlow mobile SSO not working" and found a support article that said I needed to allow "cross-app redirects" in iOS settings. I had no idea what that was, and neither did my IT team when I asked. We figured it out eventually — it's under Settings > Safari > Advanced. After enabling it, SSO worked on the fifth attempt.

Interviewer: How did that experience affect your perception of the app?

Emily: It destroyed my trust. I'm someone who's supposed to recommend tools to the entire company. If I can't log in, how can I recommend this? The onboarding wizard that followed was fine — seven steps, I went through them mechanically because I was already frustrated. The notification permission? Denied immediately. Not because I didn't want notifications, but because I was annoyed. It was emotional, not rational.

Interviewer: After you got in, what was the experience like?

Emily: It was actually OK once I was past the login hurdle. I found the project I needed in the search. The task approval was simple — tap the task, change status to "Approved," add a comment. That's all I needed. But here's the thing — I haven't opened the mobile app since. That login experience was so traumatic that I just wait until I'm back at my laptop. I'll note "need to approve X" on my phone and do it on desktop later. The mobile app exists on my phone, but I treat it like it doesn't.

Interviewer: What would bring you back to mobile?

Emily: Fix the SSO. That's it. The actual app, once I'm in, is fine for my needs. But if I can't reliably get in, nothing else matters. And maybe a "stay logged in" option so I don't have to go through SSO every time. On desktop, I'm logged in for weeks. On mobile, it logged me out after 24 hours.

Interviewer: Scale of 1–10?

Emily: 2. And it's entirely because of the login. Fix that and it's a 7 overnight.`,
    },
    {
        name: 'P8 — Roberto Chen (UX Researcher, 90-person design agency)',
        content: `Interviewer: How do you use your phone for work?

Roberto: Ironically, as a UX researcher, I'm critical of every mobile experience. I use my phone for Slack, email, note-taking during user sessions, and checking project status. Maybe 30% of my work. I also use it to test the products I'm researching, so I'm very attuned to usability issues.

Interviewer: Tell me about your first experience with TaskFlow mobile.

Roberto: I'd been on desktop for two months. Downloaded mobile to follow along on project updates during user testing sessions when I can't be at my laptop. Login was Google SSO — worked fine. Then came the wizard. As a UX researcher, I was taking mental notes the entire time.

Step one: "Choose your workspace." I have one workspace. One. Why is this a step? It should auto-select. Step two: "Upload a profile photo." I already have one from desktop. It even showed my current photo with a "Change?" prompt. Unnecessary step. Step three: "Set up notifications." OK, this one's legitimate, but the timing is wrong — I'm in setup mode, not usage mode. I can't know what notifications I want yet.

Step four was the most egregious: "Discover pinned projects." It showed me a list of all 34 projects with checkboxes to "pin" favourites. On a phone screen. I had to scroll through all 34 to decide which ones to pin. No search, no filter by team, no "suggested based on your recent activity." Just a raw list. I pinned two and moved on.

Steps five through seven were about widgets, keyboard shortcuts (on mobile?!), and a video tutorial. I skipped all three. The fact that the wizard included keyboard shortcuts — a desktop concept — on mobile tells me this wasn't designed for mobile at all. It was a desktop wizard ported to a mobile screen.

Interviewer: You said it felt like a desktop port. Can you elaborate?

Roberto: Everything about it screams desktop-first. The information density is too high for mobile. Cards have four lines of metadata per task — title, description preview, assignee, due date, priority badge, project badge, tags. On desktop, where cards are 300px wide, that works. On mobile, each card is a dense block of text that's hard to scan. The tap targets are small — I have large-ish fingers, and I keep accidentally tapping the wrong element. The header icons are clustered together — notifications bell, settings gear, profile avatar, all within 60px of each other.

And the navigation assumes you know where things are. On desktop, you can see everything at once. On mobile, everything is hidden behind tabs and menus. There's no progressive disclosure — you either see nothing or everything.

Interviewer: If you were redesigning this, what would you prioritize?

Roberto: Start with "what do mobile users actually do?" My hypothesis is that mobile task management is about three things: check status, update status, and respond to notifications. Design for those three jobs-to-be-done. Everything else — creating complex tasks, configuring projects, analytics — belongs on desktop. Don't try to be everything on every platform.

For onboarding specifically: no wizard. Just show me my stuff. If something needs setup (like notifications), ask me contextually — when I first receive an update that I can't see because notifications are off, that's the perfect moment to prompt.

Interviewer: Scale of 1–10?

Roberto: 4. It does what I need minimally, but the experience is far below what I'd consider acceptable for a modern mobile app. The onboarding felt like it was testing my patience, not welcoming me.`,
    },
    {
        name: 'P9 — Mei-Lin Park (Junior Product Analyst, 60-person analytics startup)',
        content: `Interviewer: Tell me about how you use your phone for work.

Mei-Lin: I'm pretty much always on my phone. I'm 24, grew up with smartphones, and I default to mobile for most things. At work, I use my phone for Slack, checking dashboards, taking meeting notes, and scanning documents. I'd say 60% of my work interaction starts on my phone, even if I move to desktop for heavy analysis.

Interviewer: How did you start with TaskFlow?

Mei-Lin: I'm new to the company — started three weeks ago. TaskFlow was listed as one of the tools to install during my first-day IT setup. I went to the app store, downloaded it, and opened it. I'd never used TaskFlow on any platform before, so this was a completely fresh experience. The app asked me to sign up or join a workspace. I chose "join" and entered a workspace ID that IT gave me. It worked. Then it asked for my name, email, and to set a password. Standard stuff.

Interviewer: Was there an onboarding wizard?

Mei-Lin: Yes, but it felt manageable to me. Maybe because I didn't have desktop expectations? The steps were: choose a profile photo, set notification preferences, explore your workspace. Only three steps. The notification request — I said yes to everything because I wanted to make sure I didn't miss anything as the new person. I wanted to look responsive and engaged.

Interviewer: Interesting. So the notification timing worked for you because of your social context?

Mei-Lin: Exactly. As a new hire, my motivation is different. I'm trying to prove myself, so I want all the alerts. Someone who's been at the company for years might not feel that urgency. For me, the notification prompt actually aligned with my goals at that moment.

Interviewer: How did you find the app once you were in?

Mei-Lin: Honestly? Pretty intuitive. The Home tab showed me recent activity from my team. I could see what projects were happening, who was working on what. My Tasks was clear — I had three tasks assigned from my onboarding. I tapped into one, read the description, added a comment saying "On it!", and changed the status to "In Progress." Total time from app install to completing my first action: about four minutes. That felt fast.

The one thing that confused me was the relationship between "Projects" and "Teams." On the More tab, I saw both, and I wasn't sure how they connected. Are teams groups of people? Are projects within teams? Eventually I figured it out, but a simple tooltip or visual hierarchy would help. Like nesting projects under teams in the menu.

Interviewer: Show me how you'd create a new task.

Mei-Lin: Plus button in the header... right. I always have to look for it because I expect it at the bottom. OK, title: "Draft stakeholder interview questions." Now, assignee — I'll assign to myself. Due date: Friday. Priority: hmm, where's the priority? Oh, I have to scroll down. There it is. Medium. Project: I'll add it to "Onboarding Analytics Project." Ah, to select a project I have to search for it by name. It would be nice if my pinned projects showed up first. OK, found it. Save. That took about 40 seconds. Not bad, but the scrolling to find priority and the project search could be streamlined.

Interviewer: What would you change about the experience?

Mei-Lin: Mostly small stuff. Put the add button at the bottom of the screen, not the header — that's where my thumb naturally rests. Show pinned projects first when assigning tasks. And for the notification setup, add examples of what each notification type looks like — "Task assignment notifications look like [screenshot]." I said yes to everything, but I'd like to know what I agreed to.

Interviewer: Scale of 1–10?

Mei-Lin: 8. As someone who started mobile-first with no desktop expectations, it was a smooth experience. The app does what I need. Minor polish would take it to a 9 or 10.`,
    },
    {
        name: 'P10 — Alex Rivera (Sales Director, 400-person enterprise SaaS)',
        content: `Interviewer: Tell me about a typical workday and how you use your phone.

Alex: I'm client-facing all day. Meetings, demos, dinners. I basically live on my phone between meetings. I use it for CRM updates, email, Slack, and checking deal pipeline. Mobile needs to be fast for me — I'm usually doing things in 60-second windows between calls.

Interviewer: Walk me through your TaskFlow mobile experience.

Alex: We switched to TaskFlow six months ago for cross-team collaboration. Sales, CS, and product use it together to track customer projects. I downloaded the mobile app because I needed to update task statuses during a road trip. Our company uses OneLogin for SSO. The login flow opened a browser, went to OneLogin, I authenticated, and it redirected back. It worked on the second try — first try got stuck in a redirect loop. Common enough that I wasn't shocked, but still annoying.

Interviewer: What was the onboarding like?

Alex: Full seven-step wizard. I'll be honest, I didn't really engage with it. I speed-tapped through every step. Choose workspace — tap. Profile photo — tap "skip." Notifications — tap "allow" because I need alerts for customer escalations. Pin projects — I didn't pin anything because I didn't know which ones to pin yet. Widget setup — skip. Tutorial — skip. Done.

The speed-tapping took about 90 seconds. Not the end of the world, but it felt like a waste of time. If the wizard had a "Skip all, take me to the app" button on slide one, I would have used it.

Interviewer: Once you were in, how did you find things?

Alex: Finding things is my main pain point. I work across 12 customer projects. On desktop, I can see them all in the sidebar. On mobile, I have to go to More > All Projects and scroll. There's no way to group by team or filter by status. So every time I need to check on a specific customer project, I search. The search works, but it feels wrong that search is the only way to find things. Navigation should surface frequently used items automatically.

I've started using search as my primary navigation — I open the app, immediately go to search, type the customer name, and find the project. It works, but it's a workaround, not a designed path.

Interviewer: Tell me about updating a task on mobile.

Alex: This is where mobile actually shines for my use case. I tap into a task — usually something like "Follow up with customer on contract." I change the status from "To Do" to "In Progress" or "Done." I sometimes add a comment like "Sent contract revision, awaiting sign-off." That's it. The status change is a single tap (there's a nice dropdown). The comment is quick text input. For these micro-interactions, mobile is actually faster than desktop because I don't have to open a browser, navigate to the project, find the task, etc.

Interviewer: What about the notification experience?

Alex: Notifications are critical for me and they work well. I get alerts when someone comments on tasks I'm watching, when due dates are approaching, and when a teammate changes status. The notification text is clear — "Marcus moved 'Contract Review' to Done." I can tap the notification and go straight to the task. This is the best part of the mobile experience, honestly.

The irony is that I almost missed out on this because the notification permission was buried in step three of the wizard. If I'd been in a rush and declined, I'd have had a much worse experience. The fact that notifications are the killer feature but the permission ask is the most easily dismissible step is a design contradiction.

Interviewer: What would you change?

Alex: Three things. One, smarter navigation — show me my most recently accessed projects without searching. Like a "Recent Projects" widget on the home screen. Two, a "quick capture" feature — I want to dictate a task while walking between meetings. Voice-to-task. Three, better landscape support — when I'm in a car using the mount, my phone is horizontal and the app is unusable.

Interviewer: Scale of 1–10?

Alex: 7. For status updates and notifications, it's great. For navigation and task creation, it's clunky. Net-net, it's a useful tool that could be an excellent tool with some focused improvements.`,
    },
];

// ─── Export ────────────────────────────────────────────────────────────────

export const MOCK_PROJECT = {
    context: MOCK_CONTEXT,
    researchObjects: [MOCK_FRAMING, MOCK_PLAN, MOCK_SCREENER, MOCK_INTERVIEW, MOCK_INSIGHTS],
    transcripts: MOCK_TRANSCRIPTS.map((t) => ({ ...t, id: uuidv4() })),
};
