import { getUser } from "@civic/auth-web3/nextjs";

export async function MyServerComponent() {
  const user = await getUser();

  if (!user) return <div>User not logged in</div>;

  return <div>Hello {user.name}!</div>;
}
