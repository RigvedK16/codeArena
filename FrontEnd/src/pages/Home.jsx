import { useState } from "react";
import { FiPlus } from "react-icons/fi";

export default function Home() {
  const [groups] = useState([
    { id: 1, name: "Goa Trip", status: "Open", role: "Admin" },
    { id: 2, name: "Dinner at Taj", status: "Open", role: "Member" },
    { id: 3, name: "Hiking Weekend", status: "Open", role: "Member" },
  ]);

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold">Welcome back, Cooper User</h1>
        <div className="mt-4 card bg-white shadow">
          <div className="card-body">
            <h2 className="card-title">Wallet Balance</h2>
            <p className="text-2xl">₹12,000</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Your Groups</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {groups.map((g) => (
            <div key={g.id} className="card bg-white shadow">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h3 className="card-title">{g.name}</h3>
                  <div className="badge badge-outline">{g.status}</div>
                </div>
                <div className="badge badge-primary">{g.role}</div>
              </div>
            </div>
          ))}

          <div className="card bg-white shadow place-content-center">
            <div className="card-body items-center text-center">
              <div className="avatar placeholder mb-2">
                <div className="bg-base-200 text-base-content rounded-full w-16">
                  <FiPlus className="w-8 h-8 m-auto" />
                </div>
              </div>
              <h3 className="card-title">Create New Group</h3>
              <p className="opacity-70">Start a pooled event</p>
              <button className="btn btn-primary" onClick={() => document.getElementById("create-group-modal").showModal()}>
                New Group
              </button>
            </div>
          </div>
        </div>
      </main>

      <dialog id="create-group-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Create a new group</h3>
          <form className="grid grid-cols-1 gap-4">
            <input type="text" placeholder="Group Name" className="input input-bordered" />
            <input type="text" placeholder="Description" className="input input-bordered" />
            <input type="number" placeholder="Deposit Amount Per Person" className="input input-bordered" />
            <select className="select select-bordered">
              <option>INR</option>
              <option>USD</option>
            </select>
          </form>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
              <button className="btn btn-primary" type="button">Create</button>
            </form>
          </div>
        </div>
      </dialog>

      <button
        className="btn btn-primary btn-circle fixed bottom-6 right-6 shadow-lg"
        onClick={() => document.getElementById("create-group-modal").showModal()}
        aria-label="Create New Group"
      >
        <FiPlus className="w-6 h-6" />
      </button>
    </div>
  );
}
