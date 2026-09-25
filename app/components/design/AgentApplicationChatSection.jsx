"use client";

import { useState } from "react";
import AgentChatPanel from "@/app/components/design/AgentChatPanel";
import ApplicationChatPanel from "@/app/components/dashboard/ApplicationChatPanel";
import { getAgentSupportChat, sendAgentSupportChatMessage } from "@/lib/api";

export default function AgentApplicationChatSection({ application }) {
  const [activeChatTab, setActiveChatTab] = useState("customer");
  const appId = application?.raw_id || application?.id;

  if (!appId) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveChatTab("customer")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeChatTab === "customer"
                ? "bg-[#28A745] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Chat with Customer
          </button>
          <button
            type="button"
            onClick={() => setActiveChatTab("support")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeChatTab === "support"
                ? "bg-[#28A745] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Chat with Vehiculars Support
          </button>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          {activeChatTab === "customer" ? "Direct applicant messaging" : "Internal agent support line"}
        </span>
      </div>

      {activeChatTab === "customer" ? (
        <ApplicationChatPanel
          applicationId={appId}
          myRole="agent"
          title="Live Chat with Customer (Applicant)"
        />
      ) : (
        <AgentChatPanel
          myRole="agent"
          headerLabel="Chat with Support"
          loadThread={() => getAgentSupportChat(appId)}
          sendMessage={(msg) => sendAgentSupportChatMessage(appId, { body: typeof msg === "string" ? msg : msg?.body })}
        />
      )}
    </div>
  );
}
