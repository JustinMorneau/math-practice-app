import { BrowserRouter } from 'react-router';
import AppProvider from './AppProvider';
import AppRoutes from './AppRoutes';

/** Root component: shared app data, then routing. */
function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
