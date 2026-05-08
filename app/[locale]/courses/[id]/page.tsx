import * as clerk from '@clerk/nextjs/server';
import Course from "../../../pages/Course";

export default async function CourseRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Course courseId={id} />
  );
}
