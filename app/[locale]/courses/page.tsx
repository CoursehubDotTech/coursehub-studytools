import * as clerk from '@clerk/nextjs/server';
import Courses from "../../pages/Courses";

export default async function Home() {
  const user = await clerk.currentUser();
  const userObj = user ? {
    fullName: user.fullName || '',
  } : null;

  return (
    <Courses userObj={userObj}/>
  );
}
