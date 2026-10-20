// Valide le corps de POST /api/tools.
// Renvoie { ok: true, value } ou { ok: false, error, field }.
//
// Décisions du PO (US-02) :
// - le nom est compté après trim ; s'il n'est pas une chaîne → 400, field "name" ;
//   les noms en double sont autorisés ;
// - la description est trimée ; absente → "".
export function validateNewTool(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return fail('Le corps de la requête doit être un objet JSON', 'body');
  }

  const { name, category, description } = body;

  if (typeof name !== 'string') {
    return fail('Le nom doit être une chaîne de caractères', 'name');
  }
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return fail('Le nom est obligatoire', 'name');
  }

  if (typeof category !== 'string') {
    return fail('La catégorie doit être une chaîne de caractères', 'category');
  }
  const trimmedCategory = category.trim();
  if (trimmedCategory.length === 0) {
    return fail('La catégorie est obligatoire', 'category');
  }

  let trimmedDescription = '';
  if (description !== undefined) {
    if (typeof description !== 'string') {
      return fail('La description doit être une chaîne de caractères', 'description');
    }
    trimmedDescription = description.trim();
  }

  return {
    ok: true,
    value: { name: trimmedName, category: trimmedCategory, description: trimmedDescription },
  };
}

function fail(error, field) {
  return { ok: false, error, field };
}
