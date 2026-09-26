import { useState } from 'react';
import { BrushUnderline, LightbulbDoodle } from './questionnaire/Doodles';

const navigation = ['Courses', 'eBooks', 'Webinars', 'Community', 'Resources', 'Success Stories', 'About'];
const stages = [
  ['Aspiring entrepreneur', 'Find an idea worth building.'],
  ['Early-stage founder', 'Validate it. Make your first move.'],
  ['Business owner', 'Strengthen the business you have.'],
  ['Scaling founder', 'Build the systems for what’s next.'],
];
const formats = [
  { icon: 'course', id: 'courses', title: 'Entrepreneurship courses', description: 'Build practical business skills with step-by-step lessons and exercises.', action: 'Explore entrepreneurship courses', label: 'Learn at your pace' },
  { icon: 'book', id: 'ebooks', title: 'eBooks & playbooks', description: 'Keep startup frameworks, checklists and business guides close at hand.', action: 'Browse startup eBooks', label: 'Your founder’s bookshelf' },
  { icon: 'video', id: 'webinars', title: 'Live expert webinars', description: 'Work through real business questions with founders and experienced mentors.', action: 'Explore founder webinars', label: 'Learn through conversation' },
  { icon: 'people', id: 'community', title: 'Founder community', description: 'Exchange ideas, share progress and learn alongside other entrepreneurs.', action: 'Explore the founder community', label: 'Build alongside others' },
] as const;

type IconName = 'course' | 'book' | 'video' | 'people' | 'arrow' | 'check';
function LineIcon({ name }: { name: IconName }) {
  return (
    <svg className="wire-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'course' && <><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M9 21h6m-3-4v4m-2-14 5 3-5 3Z" /></>}
      {name === 'book' && <><path d="M12 5v16M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z" /><path d="M6 8h3m6 0h3M6 12h3m6 0h3" /></>}
      {name === 'video' && <><rect x="3" y="5" width="13" height="14" rx="2" /><path d="m16 10 5-3v10l-5-3Z" /></>}
      {name === 'people' && <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3" /></>}
      {name === 'arrow' && <path d="M4 12h16m-6-6 6 6-6 6" />}
      {name === 'check' && <path d="m5 12 4 4L19 6" />}
    </svg>
  );
}
function PreviewAction({ children }: { children: string }) {
  return <span className="wire-button">{children}<LineIcon name="arrow" /></span>;
}

function LearningWidgets() {
  return (
    <section className="wire-section wire-tinted" aria-labelledby="learning-widgets-title">
      <span className="wire-kicker">Made for the way you learn</span>
      <h3 id="learning-widgets-title">Find your way forward.</h3>
      <p className="wire-widgets-intro">Practical entrepreneurship learning, in the format that works for you.</p>
      <div className="wire-formats">
        {formats.map((format, index) => (
          <article className={`wire-format wire-widget-${format.id}`} key={format.id} aria-labelledby={`widget-${format.id}-title`}>
            <div className="wire-widget-header"><span className="wire-widget-number" aria-hidden="true">0{index + 1}</span><span>{format.label}</span><LineIcon name={format.icon} /></div>
            <h4 id={`widget-${format.id}-title`}>{format.title}</h4>
            <p>{format.description}</p>
            {format.id === 'courses' && <div className="wire-widget-content"><span className="wire-widget-label">A starting path</span><ol className="wire-widget-lessons">{['Find a business idea', 'Understand your customer', 'Build your first plan'].map((lesson, index) => <li key={lesson}><span>0{index + 1}</span>{lesson}</li>)}</ol></div>}
            {format.id === 'ebooks' && <div className="wire-widget-content wire-widget-library"><div className="wire-widget-book"><span>FOUNDER’S<br />FIELD GUIDE</span><strong>Idea<br />to launch.</strong><span>PRENEUR GATE</span></div><div><span className="wire-widget-label">From the library</span><strong>Frameworks for your next move</strong><p>Validation checklists, planning guides and practical templates.</p></div></div>}
            {format.id === 'webinars' && <div className="wire-widget-content wire-widget-session"><span className="wire-widget-label">Expert session preview</span><strong>Is your business idea worth building?</strong><span className="wire-widget-meta"><LineIcon name="video" />Expert insights + live Q&amp;A</span></div>}
            {format.id === 'community' && <div className="wire-widget-content wire-widget-discussion"><span className="wire-widget-label">Conversation starters</span><strong>How would you find your first customer?</strong><div className="wire-widget-tags"><span>Ask a founder</span><span>Share a milestone</span></div></div>}
            <a className="wire-widget-link" href={`#layout-${format.id}`}>{format.action}<LineIcon name="arrow" /></a>
          </article>
        ))}
      </div>
    </section>
  );
}

// Widget anchors navigate within this printed preview. Production category
// links should point to dedicated, indexable pages with server-rendered content.
export function WebsiteLayoutNote() {
  const [swinging, setSwinging] = useState(true);

  return (
    <article className="website-note" aria-labelledby="website-note-title" data-swinging={swinging}>
      <span className="note-pin" aria-hidden="true"><span /></span>
      <div className="note-paper">
        <header className="note-heading">
          <h2 id="website-note-title">The website <em>layout.</em></h2>
        </header>
        <div className="note-wireframe" tabIndex={0} role="region" aria-label="Homepage design preview — scroll to explore all sections">
          <div className="wire-browser" aria-hidden="true"><span className="wire-browser-dots"><i /><i /><i /></span><span>preneurgate / home</span><span>01</span></div>
          <div className="wire-nav">
            <strong className="wire-wordmark">preneur<span>gate</span><i>.</i></strong>
            <span className="wire-signin">Sign In <PreviewAction>Start Learning</PreviewAction></span>
            <div className="wire-nav-links">{navigation.map(item => <span key={item}>{item}</span>)}</div>
          </div>
          <section className="wire-hero">
            <span className="wire-kicker">The entrepreneur’s learning space</span>
            <div className="wire-hero-title-row"><h3>Learn entrepreneurship.<br />Build something<br /><em>that matters.</em></h3><LightbulbDoodle className="wire-hero-bulb" /></div>
            <BrushUnderline className="wire-hero-brush" />
            <p>Build, launch and grow your business with practical courses, expert guidance and people who get it.</p>
            <div className="wire-actions"><PreviewAction>Explore Courses</PreviewAction><span>Join the community</span></div>
            <div className="wire-roadmap"><span className="wire-kicker">From an idea to your next chapter</span><div>{['Find your idea', 'Make it real', 'Build to grow'].map((step, index) => <span key={step}><b>0{index + 1}</b>{step}</span>)}</div></div>
          </section>
          <div className="wire-trust">{['Practical learning', 'Expert guidance', 'Founder community'].map(item => <span key={item}><LineIcon name="check" />{item}</span>)}</div>
          <section className="wire-section">
            <span className="wire-kicker">Your ambition. Your starting point.</span><h3>Every stage. A next step.</h3>
            <div className="wire-stages">{stages.map(([stage, description], index) => <div key={stage}><span className="wire-index">0{index + 1}</span><div><strong>{stage}</strong><p>{description}</p></div></div>)}</div>
          </section>
          <LearningWidgets />
          <section className="wire-section" id="layout-courses">
            <span className="wire-kicker">Put your knowledge to work</span><div className="wire-section-heading"><h3>A good place to start.</h3><span>All courses →</span></div>
            <div className="wire-grid wire-grid-three">
              {[
                ['Foundations', 'Start a business from scratch', 'Idea · Research · Plan'],
                ['Validation', 'Find a problem worth solving', 'Test · Learn · Refine'],
                ['Growth', 'Build your next growth plan', 'Market · Sell · Grow'],
              ].map(([category, course, skills], index) => <div className="wire-course" key={course}><div className={`wire-course-art wire-art-${index}`}><span>FIELD NOTES / 0{index + 1}</span><strong>{category}</strong><div className="wire-book-rules" aria-hidden="true" /></div><span className="wire-course-category">{category}</span><strong>{course}</strong><span>{skills}</span><b>View course →</b></div>)}
            </div>
          </section>
          <section className="wire-section wire-ebooks" id="layout-ebooks">
            <span className="wire-kicker">Keep a practical guide close</span><h3>A bookshelf for building a business.</h3>
            <p>Entrepreneurship eBooks and playbooks to help you turn what you learn into a clear next step.</p>
            <ul>{[['Idea validation', 'Test the problem before you invest in a solution.'], ['Business planning', 'Map your offer, audience and route to market.'], ['Startup finance', 'Work through costs, pricing and cash flow.']].map(([title, description]) => <li key={title}><LineIcon name="book" /><div><h4>{title}</h4><p>{description}</p></div></li>)}</ul>
          </section>
          <section className="wire-section wire-difference"><span className="wire-kicker">Less theory. More doing.</span><h3>Learn it today.<br /><em>Use it tomorrow.</em></h3><p>Real founder stories. Practical exercises. Tools you can open and use. Learning built around the decisions in front of you.</p><div><span>Experienced mentors</span><span>Templates &amp; tools</span><span>Live Q&amp;As</span></div></section>
          <section className="wire-section" id="layout-webinars">
            <span className="wire-kicker">A conversation worth joining</span><div className="wire-section-heading"><h3>Learn live with the experts.</h3><span>All webinars →</span></div>
            <div className="wire-event"><div className="wire-event-mark"><LineIcon name="video" /><span>LIVE<br />SESSION</span></div><div><span className="wire-kicker">Founder conversations</span><strong>Validate your idea before spending money</strong><p>Speaker · Date &amp; time · Duration · Free / Paid</p><PreviewAction>Reserve Your Seat</PreviewAction></div></div>
          </section>
          <section className="wire-section wire-community" id="layout-community"><span className="wire-kicker">Better, together</span><h3>You don’t have to<br />build alone.</h3><p>Ask the question. Share the small win. Find a founder who’s figuring it out, too.</p><div className="wire-community-topics"><span>Ask &amp; learn</span><span>Share progress</span><span>Stay accountable</span></div><PreviewAction>Join the Community</PreviewAction></section>
          <section className="wire-section"><span className="wire-kicker">The work behind the wins</span><h3>What our entrepreneurs are building.</h3><div className="wire-story"><span className="wire-story-label">FOUNDER<br />JOURNAL<br /><b>01</b></span><div><strong>From an idea to the first customers.</strong><p>The challenge. The turning point. What happened next.</p><span>Read their story →</span></div></div></section>
          <section className="wire-section wire-tinted"><span className="wire-kicker">Notes from the field</span><h3>Fresh thinking for your next move.</h3><div className="wire-insights">{['What validation really teaches you', 'Finding your first 50 customers', 'A practical look at startup pricing'].map((title, index) => <div key={title}><span>0{index + 1}</span><strong>{title}</strong><LineIcon name="arrow" /></div>)}</div></section>
          <section className="wire-section wire-newsletter"><span className="wire-kicker">A useful read. A fresh perspective.</span><h3>Good ideas for your inbox.</h3><p>Founder insights, practical frameworks and what’s coming next.</p><div className="wire-email"><span>Your email address</span><PreviewAction>Join Newsletter</PreviewAction></div></section>
          <section className="wire-section wire-faq"><span className="wire-kicker">Before you begin</span><h3>A few things you might be wondering.</h3>{['Can beginners join?', 'Are courses self-paced?', 'What’s included in membership?'].map(question => <div key={question}><span>{question}</span><span aria-hidden="true">+</span></div>)}<p>Also: webinars, community access, certificates &amp; eBook downloads.</p></section>
          <section className="wire-section wire-final"><span className="wire-kicker">Your next chapter starts here</span><h3>That business you’ve<br />been thinking about?<br /><em>Let’s build it.</em></h3><div className="wire-actions"><PreviewAction>Start Learning</PreviewAction><span>Explore courses</span></div></section>
          <div className="wire-footer"><strong className="wire-wordmark">preneur<span>gate</span><i>.</i></strong><p>For the business you want to build.</p><div className="wire-grid wire-grid-four">{[['Learn', 'Courses · eBooks', 'Webinars · Community'], ['Topics', 'Business · Marketing', 'Finance · Leadership'], ['Resources', 'Templates · Guides', 'Blog · Stories'], ['Company', 'About · Contact', 'Mentors · Careers']].map(([title, ...links]) => <div key={title}><strong>{title}</strong>{links.map(link => <span key={link}>{link}</span>)}</div>)}</div><p className="wire-legal">Terms · Privacy · Refund Policy · Cookie Policy</p></div>
        </div>
        <footer className="note-footer"><span>Scroll to explore the homepage ↓</span><button type="button" onClick={() => setSwinging(value => !value)} aria-pressed={!swinging} aria-label="Pause paper motion">{swinging ? 'Pause motion' : 'Resume motion'}</button></footer>
      </div>
    </article>
  );
}
