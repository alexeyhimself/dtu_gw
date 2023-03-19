NEW_FILE_NAME=dtu_app.html

cp app.html $NEW_FILE_NAME

# delete google analytics
sed -i '' '/googletagmanager/,/<\/script-->/d' $NEW_FILE_NAME

# delete nav bar
sed -i '' '/navbar-expand-lg/,/<\/nav>/d' $NEW_FILE_NAME

# delete emulator
sed -i '' '/dtu_client_emulator/d' $NEW_FILE_NAME

# delete SDK import
sed -i '' '/customer\/dtu_sdk_js/,/<\/script>/d' $NEW_FILE_NAME

# replace all ="src/ with ="https://dotheyuse.com/src/
sed -i '' 's/href="src/href="https:\/\/dotheyuse.com\/src/g' $NEW_FILE_NAME
sed -i '' 's/src="src/src="https:\/\/dotheyuse.com\/src/g' $NEW_FILE_NAME

# remove data-dtu attributes
list_of_dtu_attributes=$(cat dtu_app.html | gawk 'match($0, /(data-dtu="[a-z0-9A-Z \-\.\:]+")/, arr) { printf "%s\n", arr[0] }')

IFS='
'
for OMG in $list_of_dtu_attributes
do
	sed -Ei '' "s/${OMG}//g" $NEW_FILE_NAME
done

mv $NEW_FILE_NAME ./src/customer/demos/
