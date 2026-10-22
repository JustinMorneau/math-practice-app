import { RouterProvider, createBrowserRouter } from 'react-router';
import AppProvider from './AppProvider';
import { createAppRoutes } from './routeTable';

const router = createBrowserRouter(createAppRoutes());

/** Root component: shared app data, then routing. */
function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}

export default App;
