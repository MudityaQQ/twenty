import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRecoilCallback } from 'recoil';

import { useOptimisticEffect } from '@/apollo/optimistic-effect/hooks/useOptimisticEffect';
import { OptimisticEffectDefinition } from '@/apollo/optimistic-effect/types/OptimisticEffectDefinition';
import { currentViewIdScopedState } from '@/ui/data/view-bar/states/currentViewIdScopedState';
import { filtersScopedState } from '@/ui/data/view-bar/states/filtersScopedState';
import { savedFiltersFamilyState } from '@/ui/data/view-bar/states/savedFiltersFamilyState';
import { savedSortsFamilyState } from '@/ui/data/view-bar/states/savedSortsFamilyState';
import { sortsScopedState } from '@/ui/data/view-bar/states/sortsScopedState';
import { FilterDefinition } from '@/ui/data/view-bar/types/FilterDefinition';
import { SortDefinition } from '@/ui/data/view-bar/types/SortDefinition';
import { useRecoilScopeId } from '@/ui/utilities/recoil-scope/hooks/useRecoilScopeId';
import { SortOrder } from '~/generated/graphql';

import { useSetDataTableData } from '../hooks/useSetDataTableData';
import { TableRecoilScopeContext } from '../states/recoil-scope-contexts/TableRecoilScopeContext';

export const DataTableEffect = ({
  useGetRequest,
  getRequestResultKey,
  getRequestOptimisticEffectDefinition,
  orderBy = [
    {
      createdAt: SortOrder.Desc,
    },
  ],
  whereFilters,
  filterDefinitionArray,
  setActionBarEntries,
  setContextMenuEntries,
  sortDefinitionArray,
}: {
  // TODO: type this
  useGetRequest: any;
  getRequestResultKey: string;
  getRequestOptimisticEffectDefinition: OptimisticEffectDefinition<any>;
  // TODO: type this and replace with defaultSorts reduce should be applied to defaultSorts in this component not before
  orderBy?: any;
  // TODO: type this and replace with defaultFilters reduce should be applied to defaultFilters in this component not before
  whereFilters?: any;
  filterDefinitionArray: FilterDefinition[];
  sortDefinitionArray: SortDefinition[];
  setActionBarEntries?: () => void;
  setContextMenuEntries?: () => void;
}) => {
  const setDataTableData = useSetDataTableData();
  const { registerOptimisticEffect } = useOptimisticEffect();

  useGetRequest({
    variables: { orderBy, where: whereFilters },
    onCompleted: (data: any) => {
      const entities = data[getRequestResultKey] ?? [];

      setDataTableData(entities, filterDefinitionArray, sortDefinitionArray);

      registerOptimisticEffect({
        variables: { orderBy, where: whereFilters },
        definition: getRequestOptimisticEffectDefinition,
      });
    },
  });

  const [searchParams] = useSearchParams();
  const tableRecoilScopeId = useRecoilScopeId(TableRecoilScopeContext);
  const handleViewSelect = useRecoilCallback(
    ({ set, snapshot }) =>
      async (viewId: string) => {
        const currentView = await snapshot.getPromise(
          currentViewIdScopedState(tableRecoilScopeId),
        );
        if (currentView === viewId) {
          return;
        }

        const savedFilters = await snapshot.getPromise(
          savedFiltersFamilyState(viewId),
        );
        const savedSorts = await snapshot.getPromise(
          savedSortsFamilyState(viewId),
        );

        set(filtersScopedState(tableRecoilScopeId), savedFilters);
        set(sortsScopedState(tableRecoilScopeId), savedSorts);
        set(currentViewIdScopedState(tableRecoilScopeId), viewId);
      },
    [tableRecoilScopeId],
  );

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId) {
      handleViewSelect(viewId);
    }
    setActionBarEntries?.();
    setContextMenuEntries?.();
  }, [
    handleViewSelect,
    searchParams,
    setActionBarEntries,
    setContextMenuEntries,
  ]);

  return <></>;
};
