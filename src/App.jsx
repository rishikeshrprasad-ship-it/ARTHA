import './index.css';
import { useArthaStore } from './store/arthaStore';
import SplashScreen from './components/auth/SplashScreen';
import SignUpPage from './components/auth/SignUpPage';
import VerifyPage from './components/auth/VerifyPage';
import SignInPage from './components/auth/SignInPage';
import OnboardingFlow from './components/auth/OnboardingFlow';
import Dashboard from './components/dashboard/Dashboard';

export default function App() {
  const authStep = useArthaStore(s => s.authStep);
  const isAuthenticated = useArthaStore(s => s.isAuthenticated);

  // Route based on auth state
  if (isAuthenticated && authStep === 'dashboard') {
    return <Dashboard />;
  }

  switch (authStep) {
    case 'signup':    return <SignUpPage />;
    case 'verify':    return <VerifyPage />;
    case 'signin':    return <SignInPage />;
    case 'onboarding': return <OnboardingFlow />;
    default:          return <SplashScreen />;
  }
}
