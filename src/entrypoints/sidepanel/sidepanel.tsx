import ChatApp from "../../main";
import { ErrorBoundary } from "../../components/ChatApp";

import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ChatApp />
    </ErrorBoundary>
    </React.StrictMode>
);