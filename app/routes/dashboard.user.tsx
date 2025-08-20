import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireAuth, getUserProfile } from "~/utils/auth.server";
import { formatDate } from "~/utils/formatDate";


export const meta: MetaFunction = () => {
  return [
    {
      title: "Profile | AI VibeCoding Forum",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const userProfile = await getUserProfile(user.id);
  
  return Response.json({ user, userProfile });
}

export default function UserProfile() {
  const { user, userProfile } = useLoaderData<{
    user: any;
    userProfile: any;
  }>();

  const displayName = userProfile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const description = userProfile?.bio || 'No bio available yet.';

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 lg:text-3xl">
        Profile Details
      </h1>
      <div className="flex flex-col overflow-hidden bg-white shadow-md rounded-xl md:flex-row">
        <div className="flex flex-col w-full px-8 py-10 bg-slate-50 md:basis-1/3 md:items-center lg:py-12">
          <div className="text-center">
            <p className="font-medium text-slate-900">{displayName}</p>
            <p className="text-sm text-slate-500">Forum Member</p>
          </div>
        </div>
        <div className="px-8 py-10 md:basis-2/3 lg:px-10 lg:py-12">
          <div className="mb-6 space-y-1">
            <p className="text-sm text-slate-600">Display Name</p>
            <p className="font-medium text-slate-900">{displayName}</p>
          </div>
          <div className="mb-6 space-y-1 overflow-hidden">
            <p className="text-sm text-slate-600">Email</p>
            <p className="font-medium truncate text-slate-900">{user.email}</p>
          </div>
          <div className="mb-6 space-y-1">
            <p className="text-sm text-slate-600">Member Since</p>
            <p className="font-medium text-slate-900">{formatDate(user.created_at)}</p>
          </div>
          <div className="mb-6 space-y-1">
            <p className="text-sm text-slate-600">Bio</p>
            <p className="font-medium text-slate-900">{description}</p>
          </div>
          <div className="mb-6 space-y-1">
            <p className="text-sm text-slate-600">Account Status</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="mt-8">
            <p className="text-sm text-slate-500">
              To edit your profile information, contact support or update your settings through your authentication provider.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
