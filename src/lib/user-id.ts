export const generateUserId = (uid: string, email: string | null, displayName: string | null): string => {
  if (displayName) {
    const slug = displayName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    if (slug.length > 0) {
      const shortUid = uid.substring(0, 8);
      return `${slug}-${shortUid}`;
    }
  }
  
  if (email) {
    const emailSlug = email
      .split("@")[0]
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    if (emailSlug.length > 0) {
      const shortUid = uid.substring(0, 8);
      return `${emailSlug}-${shortUid}`;
    }
  }
  
  return uid.substring(0, 16);
};

