export type Item = { id: string; nome: string };
export type RecutAudience = 'fonte' | 'ferramenta' | 'todos';
export type CategoryFilterExpression = {
  anyOf?: readonly string[];
  allOf?: readonly string[];
  noneOf?: readonly string[];
};
