import { SignOutButton } from '@clerk/clerk-react';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import CreateGroupModal from '../components/CreateGroupModal';
import InviteQRModal from '../components/InviteQRModal';
import JoinGroupModal from '../components/JoinGroupModal';
import { useDispatch, useSelector } from "react-redux";

export default function Dashboard() {
    // const feed = useSelector((store) => store.feed);
  const dispatch = useDispatch();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  return (
    <div className="min-h-screen bg-white text-black flex">
      <Sidebar />
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            {/* <button className="btn btn-neutral">Add Expense</button> */}
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>Create New Group</button>
            <button className="btn btn-outline" onClick={() => setIsJoinOpen(true)}>Join Group</button>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="card bg-white shadow">
            <div className="card-body">
              <p className="text-sm opacity-70">Total Balance</p>
              <p className="text-3xl font-bold">$0.00</p>
              <p className="text-sm opacity-70">All settled up!</p>
            </div>
          </div>
          <div className="card bg-white shadow">
            <div className="card-body">
              <p className="text-sm opacity-70">You are owed</p>
              <p className="text-3xl font-bold text-emerald-600">$0.00</p>
            </div>
          </div>
          <div className="card bg-white shadow">
            <div className="card-body">
              <p className="text-sm opacity-70">You owe</p>
              <p className="text-3xl font-bold text-orange-500">$0.00</p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Expense Summary */}
          <div className="md:col-span-2">
            <div className="card bg-white shadow">
              <div className="card-body">
                <h2 className="card-title">Expense Summary</h2>
                <div className="grid sm:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 rounded-box bg-white">
                    <p className="text-sm opacity-70">Total this month</p>
                    <p className="text-2xl font-semibold">$0.00</p>
                  </div>
                  <div className="p-4 rounded-box bg-white">
                    <p className="text-sm opacity-70">Total this year</p>
                    <p className="text-2xl font-semibold">$0.00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Balance Details and Your Groups */}
          <div className="space-y-6">
            <div className="card bg-white shadow">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h2 className="card-title">Balance Details</h2>
                  <button className="btn btn-ghost btn-sm">View all</button>
                </div>
                <p className="opacity-70">No entries yet.</p>
              </div>
            </div>

            {/* <div className="card bg-white shadow">
              <div className="card-body">
                <h2 className="card-title">Your Groups</h2>
                <div className="py-6 text-center text-base-content/70">No groups yet</div>
                <button className="btn btn-outline w-full">Create new group</button>
              </div>
            </div> */}
          </div>
        </div>
      </div>
      <CreateGroupModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(group) => {
          const id = group?._id || group?.id;
          const name = group?.name || 'New Group';
          setInviteInfo({ id, name });
          setIsCreateOpen(false);
          window.dispatchEvent(new CustomEvent('groups:refresh'));
        }}
      />
      <JoinGroupModal
        open={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoined={() => {
          setIsJoinOpen(false);
          window.dispatchEvent(new CustomEvent('groups:refresh'));
        }}
      />
      <InviteQRModal
        open={!!inviteInfo}
        groupId={inviteInfo?.id}
        groupName={inviteInfo?.name}
        onClose={() => setInviteInfo(null)}
      />
    </div>
  );
}
