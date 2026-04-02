import { a as reactExports, R as React } from "./vendor-ui-CLSr_GWM.js";
import { u as useAuth, d as db, J as Jt } from "./index-CT7EzYyk.js";
import { p as collection, t as query, w as where, x as orderBy, v as getDocs, d as doc, z as updateDoc, n as serverTimestamp, q as addDoc, r as deleteDoc } from "./vendor-firebase-N64baH19.js";
const useSavedEntries = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [savedEntries, setSavedEntries] = reactExports.useState([]);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [isSaving, setIsSaving] = reactExports.useState(false);
  const fetchEntries = reactExports.useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      console.log("No user found");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const entriesRef = collection(db, "entries");
      const q = query(
        entriesRef,
        where("user_id", "==", user.uid),
        orderBy("updated_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const transformedEntries = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const fields = data.fields || {};
        const fieldDefinitions = data.field_definitions || [];
        return {
          id: docSnap.id,
          title: data.title,
          fields,
          fieldDefinitions,
          category: fields?.category || "Personal",
          createdAt: data.created_at?.toDate() || /* @__PURE__ */ new Date(),
          updatedAt: data.updated_at?.toDate() || /* @__PURE__ */ new Date()
        };
      });
      setSavedEntries(transformedEntries);
    } catch (error) {
      console.error("Error in fetchEntries:", error);
      Jt.error("Failed to fetch entries");
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);
  const saveEntry = reactExports.useCallback(async (entry, editingEntry) => {
    if (isSaving) {
      console.log("Save already in progress, skipping duplicate save attempt");
      return;
    }
    if (!user) {
      throw new Error("No authenticated user");
    }
    setIsSaving(true);
    try {
      if (editingEntry) {
        const entryRef = doc(db, "entries", editingEntry.id);
        await updateDoc(entryRef, {
          title: entry.title,
          fields: entry.fields,
          field_definitions: entry.fieldDefinitions || null,
          updated_at: serverTimestamp()
        });
        const updatedEntry = {
          ...editingEntry,
          title: entry.title,
          fields: entry.fields,
          fieldDefinitions: entry.fieldDefinitions || [],
          category: entry.fields?.category || "Personal",
          updatedAt: /* @__PURE__ */ new Date()
        };
        setSavedEntries((prev) => prev.map((e) => e.id === editingEntry.id ? updatedEntry : e));
        Jt.success("Entry updated successfully!");
      } else {
        const entriesRef = collection(db, "entries");
        const docRef = await addDoc(entriesRef, {
          title: entry.title,
          fields: entry.fields,
          field_definitions: entry.fieldDefinitions || null,
          user_id: user.uid,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        const savedEntry = {
          id: docRef.id,
          title: entry.title,
          fields: entry.fields,
          fieldDefinitions: entry.fieldDefinitions || [],
          category: entry.fields?.category || "Personal",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        setSavedEntries((prev) => [savedEntry, ...prev]);
        Jt.success("Entry saved successfully!");
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      Jt.error("Failed to save entry");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, user]);
  const deleteEntry = reactExports.useCallback(async (id) => {
    try {
      const entryRef = doc(db, "entries", id);
      await deleteDoc(entryRef);
      setSavedEntries((prev) => prev.filter((entry) => entry.id !== id));
      Jt.success("Entry deleted successfully!");
    } catch (error) {
      console.error("Error deleting entry:", error);
      Jt.error("Failed to delete entry");
      throw error;
    }
  }, []);
  const filteredEntries = React.useMemo(() => {
    if (!searchQuery) return savedEntries;
    const query2 = searchQuery.toLowerCase();
    return savedEntries.filter(
      (entry) => entry.title.toLowerCase().includes(query2) || entry.category && entry.category.toLowerCase().includes(query2) || Object.values(entry.fields).some(
        (value) => typeof value === "string" && value.toLowerCase().includes(query2)
      )
    );
  }, [savedEntries, searchQuery]);
  reactExports.useEffect(() => {
    if (!authLoading && user) {
      fetchEntries();
    }
  }, [user, authLoading, fetchEntries]);
  reactExports.useEffect(() => {
    const handler = () => {
      fetchEntries();
    };
    window.addEventListener("nova:entries-changed", handler);
    return () => window.removeEventListener("nova:entries-changed", handler);
  }, [fetchEntries]);
  return {
    savedEntries: filteredEntries,
    isLoading,
    isSaving,
    searchQuery,
    setSearchQuery,
    saveEntry,
    deleteEntry,
    refreshEntries: fetchEntries
  };
};
export {
  useSavedEntries as u
};
