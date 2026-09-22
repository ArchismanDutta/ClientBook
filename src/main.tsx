import ReactDOM from 'react-dom/client';
import App from './App';
import { HighlightsProvider } from './components/HighlightsProvider';
import { QuestionnaireProvider } from './components/questionnaire/QuestionnaireProvider';
import './styles/reset.css';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/page.css';
import './styles/cover.css';
import './styles/toc.css';
import './styles/book.css';
import './styles/controls.css';
import './styles/highlights.css';
import './styles/questionnaire.css';
import './styles/shelf.css';

// StrictMode intentionally omitted: page-flip's imperative DOM library
// does not survive React 19's double-invocation of effects in dev.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <HighlightsProvider>
    <QuestionnaireProvider>
      <App />
    </QuestionnaireProvider>
  </HighlightsProvider>,
);
