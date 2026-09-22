import {Plugin} from "vite";
import {ProofArray, User} from "@/types";
export function MockServer(): Plugin{
    return {
        name: "Mock Server",
        configureServer(server){
             server.middlewares.use((req, res, next)=> {
                 // /api/me
                 if (req.url && req.url.startsWith("/api/me") ){
                     const mockBody: User = {
                         email: "masarikfamilymargaret@gmail.com",
                         username: "greta",
                         role: "user",
                         name: "Greta Masarik"
                     }
                     // const mockBody: User = {
                     //      email: "masarikfamilymichael@gmail.com",
                     //      username: "michael",
                     //      role: "admin",
                     //      name: "Michael Masarik"
                     // }
                     res.statusCode = 200
                     res.end(JSON.stringify(mockBody))
                     return
                 }
                 if (req.url && req.url.startsWith("/api/proofs") ){
                     const mockBody: ProofArray = [
                         {
                             id: "abc123",
                             stage: "sara",
                             title: "Proof 1",
                             can_edit: false
                         },
                         {
                             id: "abc1234",
                             stage: "diane",
                             title: "Proof 2",
                             can_edit: false
                         },
                         {
                             id: "abc12345",
                             stage: "greta",
                             title: "Proof 3",
                             can_edit: true
                         },
                         {
                             id: "abc12",
                             stage: "diane",
                             title: "Proof 4",
                             can_edit: false
                         },
                     ]
                     res.statusCode = 200
                     res.end(JSON.stringify(mockBody))
                     return;

                 }

                 // default no-match
                 next()
             })

        }
    }
}