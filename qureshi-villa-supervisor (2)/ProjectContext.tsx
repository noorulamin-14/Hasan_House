
import React, { createContext, useContext, useState } from 'react';

interface ProjectContextType {
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    const saved = localStorage.getItem('qureshi_villa_profile_image');
    return saved || null;
  });

  const handleSetProfileImage = (image: string | null) => {
    setProfileImage(image);
    if (image) {
      localStorage.setItem('qureshi_villa_profile_image', image);
    } else {
      localStorage.removeItem('qureshi_villa_profile_image');
    }
  };

  return (
    <ProjectContext.Provider value={{
      profileImage, setProfileImage: handleSetProfileImage
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within ProjectProvider');
  return context;
};
