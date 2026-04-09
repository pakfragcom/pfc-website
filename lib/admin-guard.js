import { isAdminAuthenticated } from "./admin-auth";

export function getServerSideProps({ req }) {
  if (!isAdminAuthenticated(req)) {
    return { redirect: { destination: "/pfc-mgmt/login", permanent: false } };
  }
  return { props: {} };
}
