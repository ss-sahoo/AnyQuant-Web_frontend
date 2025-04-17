import { Plus, User } from "lucide-react"

interface AccountProps {
  name: string
  accountNumber: string
  balance: string
  accountType: string
}

function AccountCard({ name, accountNumber, balance, accountType }: AccountProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-[#E9D5FF] flex items-center justify-center">
        <User className="w-5 h-5 text-[#4F378B]" />
      </div>
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-sm text-gray-400">{accountNumber}</div>
        <div className="text-sm">
          {balance} USD, {accountType}
        </div>
      </div>
    </div>
  )
}

export function AccountsSection() {
  return (
    <div className="bg-[#1E2132] rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Accounts</h2>
        <button
          className="w-6 h-6 flex items-center justify-center text-[#14AE5C] hover:bg-[#2B2E38] rounded-full transition-colors"
          aria-label="Add account"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <AccountCard
        name="Bami Owoade"
        accountNumber="123456789 - Anyquant Demo"
        balance="100 000 000.00"
        accountType="Hedge"
      />
    </div>
  )
}
