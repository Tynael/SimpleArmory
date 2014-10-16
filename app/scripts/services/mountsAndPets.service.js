'use strict';

 angular
    .module('simpleArmoryApp')
    .factory('MountsAndPetsService', MountsAndPetsService);

function MountsAndPetsService($http, $log, LoginService, $routeParams) {
	return {
		getItems: function(jsonFile, characterProperty, collectedId) {
			return LoginService.getCharacter({'region': $routeParams.region, 'realm':$routeParams.realm, 'character':$routeParams.character})
				.then(function(character) {
					return $http.get('data/' + jsonFile + '.json', { cache: true, isArray:true })
    	            	.then(function(data) {
							
							$log.log('Parsing ' + jsonFile + '.json...');
    	        			return parseItemsObject(data.data, character[0], characterProperty, collectedId);    	
    	            	});
				});
		}
	};

	function parseItemsObject(categories, character, characterProperty, collectedId) {	
		var obj = { 'categories': [] };
		var collected = {};
		var totalCollected = 0;
		var totalPossible = 0;
	
		// Build up lookup for items that character has
		angular.forEach(character[characterProperty].collected, function(item) {
			collected[item[collectedId]] = item;
		});

		// Lets parse out all the categories and build out our structure
		angular.forEach(categories, function(category) {

			// Add the item category to the item list
			var cat = { 'name': category.name, 'subCategories': [] };
			obj.categories.push(cat);

			angular.forEach(category.subcats, function(subCategory) {

				var subCat = { 'name': subCategory.name, 'items':[] };

				angular.forEach(subCategory.items, function(item) {
					
					var itm = item;

					// fix spellid typo
					itm.spellId = item.spellid;
					delete itm.spellid;

					if (collected[itm[collectedId]]) {
						var fullItem = collected[itm[collectedId]];
						itm.collected =  true;

						totalCollected++;

						// Add pet info if we have it
						if (fullItem.qualityId) {
							var quality = '';
							switch(fullItem.qualityId)
                            {
                                case 0:
                                	quality = 'poor';
                                    break;
                                case 1:
                                    quality = 'common';
                                    break;
                                case 2:
                                    quality = 'uncommon';
                                    break;
                                case 3:
                                    quality = 'rare';
                                    break;
								case 4:
                                    quality = 'epic';                                    
                                    break;
								case 5:
                                    quality = 'legendary';                                    
                                    break;                                    
                            }

                            itm.quality = quality;
						}

						if (fullItem.stats) {
							if (fullItem.stats.breedId) {
								var breed = '';
								switch(fullItem.stats.breedId)
	                            {
	                                case 4:
	                                case 14:
	                                    breed = 'P/P';
	                                    break;
	                                case 5:
	                                case 15:
	                                    breed = 'S/S';
	                                    break;
	                                case 6:
	                                case 16:
	                                    breed = 'H/H';
	                                    break;
	                                case 7:
	                                case 17:
	                                    breed = 'H/P';
	                                    break;
	                                case 8:
	                                case 18:
	                                    breed = 'P/S';
	                                    break;
	                                case 9:
	                                case 19:
	                                    breed = 'H/S';
	                                    break;
	                                case 10:
	                                case 20:
	                                    breed = 'P/B';
	                                    break;
	                                case 11:
	                                case 21:
	                                    breed = 'S/B';
	                                    break;
	                                case 12:
	                                case 22:
	                                    breed = 'H/B';
	                                    break;
	                                case 3:
	                                case 13:
	                                    breed = 'B/B';
	                                    break;
	                            }

	                            itm.breed = breed;
							}

							itm.level = fullItem.stats.level;
						}
					}

					// Need to some extra work to determine what our url should be
                    // By default we'll use a spell id
                    var link = 'spell='+itm.spellId;

                    // If the item id is available lets use that
                    if (item.itemId) {
                        link = 'item='+item.itemId;
                    } else if (item.allianceId && character.faction === 'A') {
                        link = 'item='+item.allianceId;
                    } else if (item.hordeId && character.faction === 'H') {
                        link = 'item='+item.hordeId;
                    } else if (item.creatureId) {
                        link = 'npc='+item.creatureId;
                    }

					itm.link = link;

					// What would cause it to show up in the UI:
					//	1) You have the item
					//  2) Its still obtainable 
					//	3) You meet the class restriction
					//  4) You meet the race restriction
                    var hasthis = itm.collected;			
					var showthis = (hasthis || item.obtainable);
                    if (item.allowableRaces.length > 0)
                    {
                    	var foundRace = false;
                    	angular.forEach(item.allowableRaces, function(race) {
							if (race === character.race) {
								foundRace = true;
							}
						});

						if (!foundRace) {
							showthis = false;
						}
                    }

					if (item.allowableClasses && item.allowableClasses.length > 0)
                    {
                    	var foundClass = false;
                    	angular.forEach(item.allowableClasses, function(allowedClass) {
							if (allowedClass === character.class) {
								foundClass = true;
							}
						});

						if (!foundClass) {
							showthis = false;
						}
                    }

					if (showthis) {
						subCat.items.push(itm);
						totalPossible++;
					}
				});

				if (subCat.items.length > 0) {
					cat.subCategories.push(subCat);	
				}				
			});
    	}); 

		// Add totals
		obj.collected = totalCollected;
		obj.possible = totalPossible;

		// Data object we expose externally
		return obj;
	}
}