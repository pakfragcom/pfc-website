export default function Signup() { return null; }

export async function getServerSideProps({ query }) {
  return { redirect: { destination: `/auth/login${query.next ? `?next=${query.next}` : ''}`, permanent: true } };
}
