import PageContainer from '../components/layout/PageContainer';
import { APP_NAME } from '../app/constants';

function HomePage() {
  return (
    <PageContainer title={APP_NAME} showTitle={false}>
      <h1>Welcome to {APP_NAME}!</h1>
    </PageContainer>
  );
}

export default HomePage;
