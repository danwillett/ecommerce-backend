const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', (req, res) => {
  // find all tags
  // be sure to include its associated Product data

  try {
    const tagData = Tag.findAll({
      include: [{model: Product}]
    })
    res.status(200).json(tagData)

  } catch (err) {
    res.status(500).json(err)
  }
});

router.get('/:id', (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data

  try {
    const tagData = Tag.findByPk({
      include: [{model: Product}]
    })
    if (!tagData) {
      res.status(404).json({message: "No tag associated with this id!"})
      return;
    }
    res.status(200).json(tagData)
  } catch (err) {
    res.status(500).json(err)
  }
});

router.post('/', async (req, res) => {
  // create a new tag
  /* req.body should look like this...
    {
      tag_name: "Basketball",
      productIds: [1, 2, 3, 4]
    }
  */
  try {
    const tagData = await Tag.create(req.body)
    if (!req.body.productIds.length) {
      // add product ids to the ProductTag table
      const productTagIdArr = req.body.productIds.map((product_id) => {
        console.log(product_id)
        return {
          tag_id: tagData.id,
          product_id,
        }
      });

      ProductTag.bulkCreate(productTagIdArr)
    }
    res.status(200).json(tagData)
  } catch (err) {
    res.status(500).json(err)
  }
  
});

router.put('/:id', async (req, res) => {
  // update a tag's name by its `id` value

  try {
  const tagData = await Tag.update(req.body, {
    where: {
      id: req.params.id
    }
  })
  // find products associated with updated tag id
  const products = await ProductTag.findAll({
    where: {
      id: req.params.id
    }
  })

  // create a ProductTag array with products associated with updated tag
  const productTagIds = products.map(({product_id}) => product_id);

  // filter out products that are newly added to this tag
  const newProductTags = req.params.productIds
    .filter((product_id) => !productTagIds.includes(product_id)) // grab products from request params that aren't already in ProductTag
    .map((product_id) => {
    return {
      tag_id: tagData.id,
      product_id,
    }
  })

  // filter out products that should be removed from this tag
  const productTagsToRemove = productTagIds
    .filter(({product_id}) => !req.params.productIs.includes(product_id)) // grab products from request params that aren't already in ProductTag
    .map(({id}) => id);

  const updatedProductTags = await Promise.all(
      [
        ProductTag.destroy({
          where: {
            id: productTagsToRemove
          }
        }),
        ProductTag.bulkCreate(newProductTags)
      ]
    )
  
  res.status(200).json(updatedProductTags)

} catch (err) {
  res.status(400).json(err)
}
 
});

router.delete('/:id', async (req, res) => {
  // delete on tag by its `id` value
  try {
  const tagData = await Tag.destroy({
    where: {
      id: req.params.id
    }
  })
  if (!tagData) {
    res.status(404).json("No tag with that id!")
  }
  res.status(200).json(tagData)
} catch (err) {
  res.status(500).json(err)
}
});

module.exports = router;
