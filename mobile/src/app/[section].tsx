import { useLocalSearchParams } from 'expo-router';
import App from '../../App';
import { sectionForRoute } from '../navigation';

export default function SectionScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const routeName = Array.isArray(section) ? section[0] : section;
  return <App initialSection={sectionForRoute(routeName)} />;
}
