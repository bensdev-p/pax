import { Redirect } from 'expo-router';

/** The Profile tab became Me (SPEC v2); old links still land there. */
export default function Profile() {
  return <Redirect href="/me" />;
}
