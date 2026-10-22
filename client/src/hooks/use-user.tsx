import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { type User, UserModel } from "@/types";

function useUserQuery() {
	return useQuery({
		queryKey: ["users"],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/me`, { signal });
			if (!res.ok) throw new Error(`Request failed: ${res.status}`);
			const data = await res.json();
			return UserModel.parse(data);
		},
	});
}
type UserCtx = {
	user: User | undefined;
	isLoading: boolean;
	error: Error | null;
};
const UserContext = createContext<UserCtx | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
	const { data: user, isLoading, error } = useUserQuery();

	return (
		<UserContext value={{ user, isLoading, error }}>{children}</UserContext>
	);
}

// Custom hook for easier consumption
export function useUser() {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context;
}
