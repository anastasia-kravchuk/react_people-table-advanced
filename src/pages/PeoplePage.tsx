import { useEffect, useMemo, useState } from 'react';
import { Loader } from '../components/Loader';
import { Order, Person, Sex, SortField } from '../types';
import { getPeople } from '../api';
import { PeopleTable } from '../components/PeopleTable';
import { useParams, useSearchParams } from 'react-router-dom';
import React from 'react';
import { PeopleFilters } from '../components/PeopleFilters';
import { getFilteredPeople } from '../utils/getFilteredPeople';
import { getSortedPeople } from '../utils/getSortedPeople';

export const PeoplePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { slug: selectedSlug } = useParams();

  useEffect(() => {
    setIsLoading(true);
    setError('');
    getPeople()
      .then(data => {
        setPeople(data);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const query = searchParams.get('query');
  const centuries = searchParams.getAll('centuries').map(c => Number(c));
  const sex = searchParams.get('sex') as Sex | null;
  const sortField = searchParams.get('sort') as SortField | null;
  const order = searchParams.get('order') === 'desc' ? Order.DESC : Order.ASC;

  const sortedPeople = useMemo(() => {
    const filters = {
      query: query ?? '',
      centuries,
      sex,
    };

    const sortOptions = !sortField ? null : { sortField, order };
    const filtered = getFilteredPeople(people, filters);
    const sorted = getSortedPeople(filtered, sortOptions);

    return sorted;
  }, [centuries, order, people, query, sex, sortField]);

  const handleSearchChange = (clickedField: SortField) => {
    let nextSort: SortField | null = null;
    let nextOrder: Order | null = null;

    if (sortField !== clickedField) {
      nextSort = clickedField;
      nextOrder = Order.ASC;
    } else if (order !== Order.DESC) {
      nextSort = clickedField;
      nextOrder = Order.DESC;
    } else {
      nextSort = null;
      nextOrder = null;
    }

    const nextSearch = new URLSearchParams(searchParams.toString());

    if (nextSort === null) {
      nextSearch.delete('sort');
      nextSearch.delete('order');
    } else {
      nextSearch.set('sort', nextSort);
    }

    if (nextOrder === Order.DESC) {
      nextSearch.set('order', 'desc');
    } else {
      nextSearch.delete('order');
    }

    setSearchParams(nextSearch);
  };

  return (
    <>
      <h1 className="title">People Page</h1>
      <div className="block">
        <div className="columns is-desktop is-flex-direction-row-reverse">
          <div className="column is-7-tablet is-narrow-desktop">
            {!isLoading && people.length > 0 && (
              <PeopleFilters
                searchParams={searchParams}
                setSearchParams={setSearchParams}
              />
            )}
          </div>

          <div className="column">
            <div className="box table-container">
              {isLoading && <Loader />}

              {!isLoading && error && (
                <p data-cy="peopleLoadingError" className="has-text-danger">
                  Something went wrong
                </p>
              )}

              {!isLoading && !error && people.length === 0 && (
                <p data-cy="noPeopleMessage">
                  There are no people on the server
                </p>
              )}

              {!isLoading && !error && people.length > 0 && (
                <PeopleTable
                  people={sortedPeople}
                  selectedSlug={selectedSlug}
                  currentSortField={sortField}
                  currentOrder={order}
                  onSearchChange={handleSearchChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
