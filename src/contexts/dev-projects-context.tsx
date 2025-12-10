
"use client";

import type { DevProject, DevProjectStatus, DevProjectItem, DevProjectSubItem } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc, setDoc } from 'firebase/firestore';

interface DevProjectsContextType {
  projects: DevProject[];
  addProject: (projectData: Pick<DevProject, 'name'>) => Promise<void>;
  updateProject: (projectId: string, data: Partial<DevProject>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addItemToProject: (projectId: string, itemData: Omit<DevProjectItem, 'id' | 'subItems'>) => Promise<void>;
  updateProjectItem: (projectId: string, itemId: string, data: Partial<DevProjectItem>) => Promise<void>;
  deleteProjectItem: (projectId: string, itemId: string) => Promise<void>;
  addSubItemToItem: (projectId: string, itemId: string, subItemData: Omit<DevProjectSubItem, 'id'>) => Promise<void>;
  updateProjectSubItem: (projectId: string, itemId: string, subItemId: string, data: Partial<DevProjectSubItem>) => Promise<void>;
  deleteProjectSubItem: (projectId: string, itemId: string, subItemId: string) => Promise<void>;
  isLoading: boolean;
  allResponsibles: string[];
}

const DevProjectsContext = createContext<DevProjectsContextType | undefined>(undefined);

const initialProjects: DevProject[] = [
    {
        id: 'proj-1',
        name: 'Implementação de BI',
        items: [
            {
                id: 'item-1-1', title: 'Definir Ferramenta', status: 'Concluído', responsible: 'Ana', startDate: '2024-07-10', deadline: '2024-07-20',
                subItems: []
            },
            {
                id: 'item-1-2', title: 'Desenvolver Dashboards', status: 'Em Andamento', responsible: 'Bruno', startDate: '2024-07-21', deadline: '2024-08-15',
                subItems: [
                    { id: 'sub-1-2-1', title: 'Dashboard de Vendas', status: 'Em Andamento', responsible: 'Bruno', startDate: '2024-07-21', deadline: '2024-07-30' },
                    { id: 'sub-1-2-2', title: 'Dashboard Financeiro', status: 'Pendente', responsible: 'Carlos', startDate: '2024-08-01', deadline: '2024-08-10' },
                ]
            },
        ]
    },
    {
        id: 'proj-2',
        name: 'Novo CRM',
        items: [
            {
                id: 'item-2-1', title: 'Migração de Dados', status: 'Em Andamento', responsible: 'David', startDate: '2024-08-10', deadline: '2024-09-01',
                subItems: []
            },
        ]
    }
];

export const DevProjectsProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<DevProject[]>(initialProjects);
  const [isLoading, setIsLoading] = useState(false); // Set to true when using Firestore

  const allResponsibles = React.useMemo(() => {
    const responsibles = new Set<string>();
    projects.forEach(p => {
        p.items.forEach(i => {
            if (i.responsible) responsibles.add(i.responsible);
            i.subItems.forEach(si => {
                if (si.responsible) responsibles.add(si.responsible)
            });
        });
    });
    return Array.from(responsibles);
  }, [projects]);
  
  // NOTE: Firebase logic is commented out to use mock data. Uncomment to use Firestore.
  /*
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, 'devProjects'));
        const projectsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as DevProject));
        setProjects(projectsData);
    } catch (error) {
        console.error("Error fetching projects: ", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  */

  const addProject = async (projectData: Pick<DevProject, 'name'>) => {
    const newProject = { ...projectData, items: [] };
    // await addDoc(collection(db, 'devProjects'), newProject);
    // fetchProjects();
    setProjects(prev => [...prev, { ...newProject, id: `proj-${Date.now()}` }]);
  };

  const updateProject = async (projectId: string, data: Partial<DevProject>) => {
    // const projectDocRef = doc(db, 'devProjects', projectId);
    // await updateDoc(projectDocRef, data);
    // fetchProjects();
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } : p));
  };
  
  const deleteProject = async (projectId: string) => {
    // await deleteDoc(doc(db, 'devProjects', projectId));
    // fetchProjects();
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };
  
  const modifyProjectItems = async (projectId: string, itemsModifier: (items: DevProjectItem[]) => DevProjectItem[]) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      const newItems = itemsModifier(project.items);
      await updateProject(projectId, { items: newItems });
  };

  const addItemToProject = async (projectId: string, itemData: Omit<DevProjectItem, 'id' | 'subItems'>) => {
    const newItem = { ...itemData, id: `item-${Date.now()}`, subItems: [] };
    await modifyProjectItems(projectId, items => [...items, newItem]);
  };

  const updateProjectItem = async (projectId: string, itemId: string, data: Partial<DevProjectItem>) => {
    await modifyProjectItems(projectId, items => items.map(item => item.id === itemId ? { ...item, ...data } : item));
  };
  
  const deleteProjectItem = async (projectId: string, itemId: string) => {
    await modifyProjectItems(projectId, items => items.filter(item => item.id !== itemId));
  };
  
  const addSubItemToItem = async (projectId: string, itemId: string, subItemData: Omit<DevProjectSubItem, 'id'>) => {
    const newSubItem = { ...subItemData, id: `sub-${Date.now()}` };
    await modifyProjectItems(projectId, items => items.map(item =>
        item.id === itemId ? { ...item, subItems: [...item.subItems, newSubItem] } : item
    ));
  };

  const updateProjectSubItem = async (projectId: string, itemId: string, subItemId: string, data: Partial<DevProjectSubItem>) => {
    await modifyProjectItems(projectId, items => items.map(item =>
        item.id === itemId ? { ...item, subItems: item.subItems.map(si => si.id === subItemId ? { ...si, ...data } : si) } : item
    ));
  };
  
  const deleteProjectSubItem = async (projectId: string, itemId: string, subItemId: string) => {
    await modifyProjectItems(projectId, items => items.map(item =>
        item.id === itemId ? { ...item, subItems: item.subItems.filter(si => si.id !== subItemId) } : item
    ));
  };


  return (
    <DevProjectsContext.Provider value={{ 
        projects, 
        addProject, updateProject, deleteProject,
        addItemToProject, updateProjectItem, deleteProjectItem,
        addSubItemToItem, updateProjectSubItem, deleteProjectSubItem,
        isLoading,
        allResponsibles
    }}>
      {children}
    </DevProjectsContext.Provider>
  );
};

export const useDevProjects = () => {
  const context = useContext(DevProjectsContext);
  if (context === undefined) {
    throw new Error('useDevProjects must be used within a DevProjectsProvider');
  }
  return context;
};
