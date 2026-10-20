import { BrowserRouter } from 'react-router';
import AppRoutes from './AppRoutes';

/** Root component. Context providers (AppProvider) will wrap the routes in a later phase. */
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
