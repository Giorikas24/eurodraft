import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log("Starting migration...");

  const matchdaysSnap = await getDocs(collection(db, "matchdays"));

  for (const matchdayDoc of matchdaysSnap.docs) {
    const gamesSnap = await getDocs(collection(db, "matchdays", matchdayDoc.id, "games"));

    for (const gameDoc of gamesSnap.docs) {
      const game = gameDoc.data();

      // Migrate HCP lines
      const oldHcp = game.handicapLines || [];
      const newHcp: any[] = [];

      // Group by line value — match home and away
      const hcpMap: Record<number, any> = {};
      for (const l of oldHcp) {
        const key = Math.abs(l.line);
        if (!hcpMap[key]) hcpMap[key] = {};
        if (l.team === "home") {
          hcpMap[key].homeLine = l.line;
          hcpMap[key].homePoints = l.points;
          hcpMap[key].homeResult = l.result;
        } else {
          hcpMap[key].awayLine = l.line;
          hcpMap[key].awayPoints = l.points;
          hcpMap[key].awayResult = l.result;
        }
      }

      // Convert to new format — sort by homePoints ascending
      for (const key of Object.keys(hcpMap).sort((a, b) => Number(a) - Number(b))) {
        const h = hcpMap[Number(key)];
        newHcp.push({
          homeLine: h.homeLine ?? null,
          awayLine: h.awayLine ?? null,
          homePoints: h.homePoints ?? 0,
          awayPoints: h.awayPoints ?? 0,
          homeResult: h.homeResult ?? null,
          awayResult: h.awayResult ?? null,
        });
      }
      // Sort by homePoints
      newHcp.sort((a, b) => a.homePoints - b.homePoints);

      // Migrate OU lines
      const oldOU = game.ouLines || [];
      const ouMap: Record<number, any> = {};
      for (const l of oldOU) {
        if (!ouMap[l.line]) ouMap[l.line] = {};
        if (l.type === "over") {
          ouMap[l.line].overPoints = l.points;
          ouMap[l.line].overResult = l.result;
        } else {
          ouMap[l.line].underPoints = l.points;
          ouMap[l.line].underResult = l.result;
        }
      }

      const newOU = Object.keys(ouMap)
        .map(line => ({
          line: Number(line),
          overPoints: ouMap[Number(line)].overPoints ?? 0,
          underPoints: ouMap[Number(line)].underPoints ?? 0,
          result: ouMap[Number(line)].overResult === "win" ? "over" :
                  ouMap[Number(line)].underResult === "win" ? "under" : null,
        }))
        .sort((a, b) => a.overPoints - b.overPoints);

      await updateDoc(doc(db, "matchdays", matchdayDoc.id, "games", gameDoc.id), {
        handicapLines: newHcp,
        ouLines: newOU,
      });

      console.log(`✓ Migrated game ${gameDoc.id} in matchday ${matchdayDoc.id}`);
      console.log(`  HCP: ${oldHcp.length} entries → ${newHcp.length} lines`);
      console.log(`  OU: ${oldOU.length} entries → ${newOU.length} lines`);
    }
  }

  console.log("Migration complete!");
}

migrate().catch(console.error);