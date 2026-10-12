import { Redirect } from 'expo-router';

/** The Learn tab became Study (SPEC v2); old links still land there. */
export default function Learn() {
  return <Redirect href="/study" />;
}
