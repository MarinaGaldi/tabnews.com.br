import { getStaticPropsRevalidate } from 'next-swr';

import { ContentList, DefaultLayout } from '@/TabNewsUI';
import webserver from 'infra/webserver';
import ad from 'models/advertisement';
import authorization from 'models/authorization.js';
import content from 'models/content.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default function Home({ adFound, contentListFound, pagination }) {
  return (
    <DefaultLayout metadata={{ title: `Página ${pagination.currentPage} · Relevantes` }}>
      <ContentList ad={adFound} contentList={contentListFound} pagination={pagination} paginationBasePath="/pagina" />
    </DefaultLayout>
  );
}

export function getStaticPaths() {
  return {
    paths: [{ params: { page: '2' } }, { params: { page: '3' } }],
    fallback: 'blocking',
  };
}

export const getStaticProps = getStaticPropsRevalidate(async (context) => {
  const userTryingToGet = user.createAnonymous();

  context.params = context.params ? context.params : {};

  try {
    context.params = validator(context.params, {
      page: 'optional',
      per_page: 'optional',
    });
  } catch (error) {
    return {
      notFound: true,
    };
  }

  const results = await content.findWithStrategy({
    strategy: 'relevant',
    where: {
      parent_id: null,
      status: 'published',
    },
    page: context.params.page,
    per_page: context.params.per_page,
  });

  const contentListFound = results.rows;

  if (contentListFound.length === 0 && context.params.page !== 1 && !webserver.isBuildTime) {
    const lastValidPage = `/pagina/${results.pagination.lastPage || 1}`;
    const revalidate = context.params.page > results.pagination.lastPage + 1 ? 10 : 1;

    return {
      redirect: {
        destination: lastValidPage,
      },
      revalidate,
    };
  }

  const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  const adsFound = await ad.getRandom(1);
  const secureAdValues = authorization.filterOutput(userTryingToGet, 'read:ad:list', adsFound);

  return {
    props: {
      adFound: secureAdValues[0] ?? null,
      contentListFound: secureContentValues,
      pagination: results.pagination,
    },

    // TODO: instead of `revalidate`, understand how to use this:
    // https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration#using-on-demand-revalidation
    revalidate: 10,
  };
});
